export type Status = 'draft' | 'published' | 'scheduled' | 'archived';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    archived: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  };

  const labels = {
    draft: 'Draft',
    published: 'Published',
    scheduled: 'Scheduled',
    archived: 'Archived',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]} ${className}`}
    >
      {labels[status]}
    </span>
  );
}
