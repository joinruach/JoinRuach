/**
 * Priority Badge Component
 *
 * Visual indicator for workflow item priority.
 * Complements StatusBadge with priority-specific styling.
 */

import type { WorkflowPriority } from '@/lib/studio/types';

interface PriorityBadgeProps {
  priority: WorkflowPriority;
  className?: string;
  showIcon?: boolean;
}

const PRIORITY_STYLES: Record<WorkflowPriority, string> = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const PRIORITY_ICONS: Record<WorkflowPriority, string> = {
  urgent: '🔴',
  high: '🟠',
  normal: '🔵',
  low: '⚪',
};

const PRIORITY_LABELS: Record<WorkflowPriority, string> = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
};

export default function PriorityBadge({
  priority,
  className = '',
  showIcon = true,
}: PriorityBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[priority]} ${className}`}
    >
      {showIcon && <span>{PRIORITY_ICONS[priority]}</span>}
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
