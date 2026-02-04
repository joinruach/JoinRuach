/**
 * Inbox Stats Component
 *
 * Displays high-level statistics about the operator inbox.
 * Shows total items, urgent items, items needing review, and failed items.
 */

import type { QueueStats } from '@/lib/studio/types';

interface InboxStatsProps {
  stats: QueueStats;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color: 'blue' | 'red' | 'yellow' | 'green';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  };

  const textStyles = {
    blue: 'text-blue-900 dark:text-blue-100',
    red: 'text-red-900 dark:text-red-100',
    yellow: 'text-yellow-900 dark:text-yellow-100',
    green: 'text-green-900 dark:text-green-100',
  };

  return (
    <div
      className={`p-6 rounded-lg border-2 ${colorStyles[color]} transition-all hover:shadow-md`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${textStyles[color]} opacity-80`}>{label}</p>
          <p className={`text-3xl font-bold ${textStyles[color]} mt-2`}>{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

export default function InboxStats({ stats }: InboxStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        label="Total Items"
        value={stats.total}
        icon="📋"
        color="blue"
      />
      <StatCard
        label="Urgent"
        value={stats.urgent}
        icon="🔴"
        color="red"
      />
      <StatCard
        label="Needs Review"
        value={stats.needsReview}
        icon="👀"
        color="yellow"
      />
      <StatCard
        label="Failed"
        value={stats.failed}
        icon="⚠️"
        color="red"
      />
    </div>
  );
}
