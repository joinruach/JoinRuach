'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface Analysis {
  id: string;
  analysisId: string;
  sourceTitle: string;
  sourceUrl?: string;
  concernScore: number;
  status: 'pending' | 'analyzed' | 'reviewed' | 'published';
  analysisDate: string;
  categories: Array<{
    category: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  issues: Array<{
    issueId: string;
    title: string;
    category: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  confidenceLevel: number;
}

interface TrendReport {
  period: string;
  averageConcernScore: number;
  highestConcernCategory: string;
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  keyThemes: string[];
  analysisSummary: string;
}

export default function DiscernmentDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const [locale, setLocale] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'submit' | 'list' | 'trends'>('list');

  // Form state
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [sourceContent, setSourceContent] = useState('');
  const [useClaudeAPI, setUseClaudeAPI] = useState(true);

  // List state
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [concernFilter, setConcernFilter] = useState<{ min: number; max: number }>({
    min: 0,
    max: 1,
  });

  // Trends state
  const [trendReport, setTrendReport] = useState<TrendReport | null>(null);
  const [trendStartDate, setTrendStartDate] = useState<string>('');
  const [trendEndDate, setTrendEndDate] = useState<string>('');

  // Selected analysis
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Success/error messages
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const { strapiJwt } = useAuth();

  useEffect(() => {
    (async () => {
      const p = await params;
      setLocale(p.locale);
    })();
  }, [params]);

  useEffect(() => {
    if (activeTab === 'list') {
      loadAnalyses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentPage, pageSize, statusFilter, categoryFilter, concernFilter]);

  const loadAnalyses = async () => {
    if (!strapiJwt) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('pageSize', pageSize.toString());

      if (statusFilter) params.append('status', statusFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (concernFilter.min > 0) params.append('minConcern', concernFilter.min.toString());
      if (concernFilter.max < 1) params.append('maxConcern', concernFilter.max.toString());

      const response = await fetch(`/api/ruach-discernment/analyses?${params}`, {
        headers: {
          Authorization: `Bearer ${strapiJwt}`,
        },
      });

      if (!response.ok) throw new Error('Failed to load analyses');

      const result = await response.json();
      setAnalyses(result.data || []);
      setTotalAnalyses(result.total || 0);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load analyses' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!strapiJwt) return;

    if (!sourceTitle.trim() || !sourceContent.trim()) {
      setMessage({ type: 'error', text: 'Title and content are required' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ruach-discernment/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${strapiJwt}`,
        },
        body: JSON.stringify({
          sourceTitle,
          sourceUrl: sourceUrl || undefined,
          sourceContent,
          useClaudeAPI,
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze content');

      const result = await response.json();

      setMessage({
        type: 'success',
        text: `Analysis complete. Concern score: ${(result.data.concernScore * 100).toFixed(1)}%`,
      });

      // Reset form
      setSourceTitle('');
      setSourceUrl('');
      setSourceContent('');

      // Refresh list
      setTimeout(() => {
        setActiveTab('list');
        setCurrentPage(1);
      }, 1500);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to analyze content' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateTrendReport = async () => {
    if (!strapiJwt || !trendStartDate || !trendEndDate) {
      setMessage({ type: 'error', text: 'Please select both start and end dates' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ruach-discernment/trend-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${strapiJwt}`,
        },
        body: JSON.stringify({
          startDate: new Date(trendStartDate),
          endDate: new Date(trendEndDate),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate report');

      const result = await response.json();
      setTrendReport(result.data);
      setMessage({ type: 'success', text: 'Trend report generated' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate trend report' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (analysisId: string, newStatus: string) => {
    if (!strapiJwt) return;

    try {
      const response = await fetch(`/api/ruach-discernment/analyses/${analysisId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${strapiJwt}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setMessage({ type: 'success', text: 'Status updated successfully' });
      loadAnalyses();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const handlePublishAnalysis = async (analysisId: string) => {
    if (!strapiJwt) return;

    try {
      const response = await fetch(`/api/ruach-discernment/analyses/${analysisId}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${strapiJwt}`,
        },
      });

      if (!response.ok) throw new Error('Failed to publish analysis');

      setMessage({ type: 'success', text: 'Analysis published successfully' });
      loadAnalyses();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to publish analysis' });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-amber-600 bg-amber-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'increasing':
        return '📈';
      case 'decreasing':
        return '📉';
      default:
        return '➡️';
    }
  };

  const totalPages = Math.ceil(totalAnalyses / pageSize);

  if (!locale) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Discernment Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Biblical analysis of AI and cultural trends
          </p>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('submit')}
            className={`px-1 py-4 font-medium text-sm border-b-2 ${
              activeTab === 'submit'
                ? 'border-ruachGold text-ruachGold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Submit Analysis
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-1 py-4 font-medium text-sm border-b-2 ${
              activeTab === 'list'
                ? 'border-ruachGold text-ruachGold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All Analyses
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-1 py-4 font-medium text-sm border-b-2 ${
              activeTab === 'trends'
                ? 'border-ruachGold text-ruachGold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Trend Reports
          </button>
        </div>
      </div>

      {/* Submit Analysis Tab */}
      {activeTab === 'submit' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Submit Content for Analysis
          </h2>

          <form onSubmit={handleSubmitAnalysis} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source Title
              </label>
              <input
                type="text"
                value={sourceTitle}
                onChange={e => setSourceTitle(e.target.value)}
                placeholder="e.g., 'OpenAI's Latest AI Alignment Research'"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source URL (optional)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://example.com/article"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content to Analyze
              </label>
              <textarea
                value={sourceContent}
                onChange={e => setSourceContent(e.target.value)}
                placeholder="Paste the content you want analyzed here..."
                rows={10}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useClaudeAPI"
                checked={useClaudeAPI}
                onChange={e => setUseClaudeAPI(e.target.checked)}
                className="h-4 w-4 border-gray-300 rounded"
              />
              <label
                htmlFor="useClaudeAPI"
                className="ml-2 text-sm text-gray-700 dark:text-gray-300"
              >
                Use Claude API for deep semantic analysis (more accurate but slower)
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Content'}
            </button>
          </form>
        </div>
      )}

      {/* List Analyses Tab */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filters</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={e => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="analyzed">Analyzed</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={e => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  <option value="theology">Theology</option>
                  <option value="ethics">Ethics</option>
                  <option value="eschatology">Eschatology</option>
                  <option value="anthropology">Anthropology</option>
                  <option value="soteriology">Soteriology</option>
                  <option value="pneumatology">Pneumatology</option>
                  <option value="ecclesiology">Ecclesiology</option>
                  <option value="cultural_trends">Cultural Trends</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Min Concern
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={concernFilter.min}
                  onChange={e => {
                    setConcernFilter({
                      ...concernFilter,
                      min: parseFloat(e.target.value),
                    });
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Concern
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={concernFilter.max}
                  onChange={e => {
                    setConcernFilter({
                      ...concernFilter,
                      max: parseFloat(e.target.value),
                    });
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Analyses Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-gray-500">Loading analyses...</div>
            ) : analyses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No analyses found. Submit content for analysis to get started.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Concern
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {analyses.map(analysis => (
                      <tr key={analysis.analysisId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {analysis.sourceTitle}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <div className="w-16 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  analysis.concernScore > 0.6
                                    ? 'bg-red-500'
                                    : analysis.concernScore > 0.3
                                      ? 'bg-amber-500'
                                      : 'bg-green-500'
                                }`}
                                style={{ width: `${analysis.concernScore * 100}%` }}
                              />
                            </div>
                            <span className="text-gray-600 dark:text-gray-400">
                              {(analysis.concernScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              analysis.status === 'published'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : analysis.status === 'reviewed'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : analysis.status === 'analyzed'
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                          >
                            {analysis.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(analysis.analysisDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAnalysis(analysis);
                              setShowDetailModal(true);
                            }}
                            className="text-ruachGold hover:underline"
                          >
                            View
                          </button>
                          {analysis.status !== 'published' && (
                            <button
                              onClick={() => handlePublishAnalysis(analysis.analysisId)}
                              className="text-blue-600 hover:underline"
                            >
                              Publish
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {(currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalAnalyses)} of {totalAnalyses} analyses
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => Math.abs(p - currentPage) <= 2)
                    .map(p => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`px-3 py-1 rounded ${
                          currentPage === p
                            ? 'bg-ruachGold text-ruachDark'
                            : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          {/* Trend Report Generator */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              Generate Trend Report
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={trendStartDate}
                  onChange={e => setTrendStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={trendEndDate}
                  onChange={e => setTrendEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleGenerateTrendReport}
                  disabled={isLoading}
                  className="w-full px-6 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 disabled:opacity-50 font-medium"
                >
                  {isLoading ? 'Generating...' : 'Generate Report'}
                </button>
              </div>
            </div>
          </div>

          {/* Trend Report Results */}
          {trendReport && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Metrics Cards */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Trend Metrics
                </h3>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Period
                    </div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {trendReport.period}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Average Concern Score
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl font-bold text-ruachGold">
                        {(trendReport.averageConcernScore * 100).toFixed(1)}%
                      </div>
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            trendReport.averageConcernScore > 0.6
                              ? 'bg-red-500'
                              : trendReport.averageConcernScore > 0.3
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                          style={{
                            width: `${trendReport.averageConcernScore * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Trend Direction
                    </div>
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">
                      {getTrendIcon(trendReport.trendDirection)} {trendReport.trendDirection}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Highest Concern Area
                    </div>
                    <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full text-sm font-semibold">
                      {trendReport.highestConcernCategory}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Themes */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Key Theological Areas
                </h3>

                <div className="space-y-2">
                  {trendReport.keyThemes.map((theme, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg text-sm"
                    >
                      {theme.charAt(0).toUpperCase() + theme.slice(1).replace('_', ' ')}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                  Analysis Summary
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {trendReport.analysisSummary}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedAnalysis.sourceTitle}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Concern Score
                </label>
                <div className="mt-2 flex items-center space-x-3">
                  <div className="text-2xl font-bold text-ruachGold">
                    {(selectedAnalysis.concernScore * 100).toFixed(1)}%
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        selectedAnalysis.concernScore > 0.6
                          ? 'bg-red-500'
                          : selectedAnalysis.concernScore > 0.3
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                      }`}
                      style={{ width: `${selectedAnalysis.concernScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Categories
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAnalysis.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(
                        cat.severity
                      )}`}
                    >
                      {cat.category} ({cat.severity})
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Issues Found
                </label>
                <div className="mt-2 space-y-2">
                  {selectedAnalysis.issues.slice(0, 5).map((issue, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {issue.title}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {issue.category} - {issue.severity}
                      </div>
                    </div>
                  ))}
                  {selectedAnalysis.issues.length > 5 && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      +{selectedAnalysis.issues.length - 5} more issues
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confidence Level
                </label>
                <div className="mt-2 text-sm">
                  {(selectedAnalysis.confidenceLevel * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              {selectedAnalysis.status !== 'published' && (
                <button
                  onClick={() => {
                    handlePublishAnalysis(selectedAnalysis.analysisId);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 font-medium"
                >
                  Publish Analysis
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
