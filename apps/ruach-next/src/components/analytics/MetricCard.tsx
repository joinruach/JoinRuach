"use client";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
  format?: 'number' | 'percentage' | 'currency';
}

/**
 * MetricCard Component
 *
 * Displays a key metric with optional trend indicator and icon.
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Total Views"
 *   value={125430}
 *   change={6.2}
 *   trend="up"
 *   format="number"
 * />
 * ```
 */
export default function MetricCard({
  title,
  value,
  change,
  trend = 'stable',
  icon,
  format = 'number',
}: MetricCardProps) {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;

    switch (format) {
      case 'percentage':
        return `${val}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(val);
      case 'number':
      default:
        return new Intl.NumberFormat('en-US').format(val);
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-neutral-600 dark:text-neutral-400';
    }
  };

  const getTrendIcon = () => {
    if (trend === 'up') {
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
            clipRule="evenodd"
          />
        </svg>
      );
    } else if (trend === 'down') {
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
            clipRule="evenodd"
          />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            {formatValue(value)}
          </p>

          {change !== undefined && (
            <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>
                {change > 0 ? '+' : ''}
                {change}%
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-500">
                vs last period
              </span>
            </div>
          )}
        </div>

        {icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
