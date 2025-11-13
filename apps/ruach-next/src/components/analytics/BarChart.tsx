"use client";

import { useMemo } from 'react';

interface BarDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarDataPoint[];
  height?: number;
  horizontal?: boolean;
  showValues?: boolean;
  title?: string;
}

/**
 * BarChart Component
 *
 * Renders a responsive bar chart (vertical or horizontal).
 *
 * @example
 * ```tsx
 * <BarChart
 *   data={[
 *     { label: 'Media', value: 12340 },
 *     { label: 'Courses', value: 8920 },
 *     { label: 'Events', value: 3240 },
 *   ]}
 *   title="Content by Type"
 * />
 * ```
 */
export default function BarChart({
  data,
  height = 300,
  horizontal = false,
  showValues = true,
  title,
}: BarChartProps) {
  const { maxValue, bars } = useMemo(() => {
    if (!data || data.length === 0) {
      return { maxValue: 0, bars: [] };
    }

    const maxValue = Math.max(...data.map((d) => d.value));

    const bars = data.map((d, i) => ({
      ...d,
      percentage: maxValue > 0 ? (d.value / maxValue) * 100 : 0,
      color: d.color || '#f59e0b',
    }));

    return { maxValue, bars };
  }, [data]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
        style={{ height }}
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No data available</p>
      </div>
    );
  }

  if (horizontal) {
    return (
      <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        {title && (
          <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {title}
          </h3>
        )}

        <div className="space-y-4">
          {bars.map((bar, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-24 flex-shrink-0 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                {bar.label}
              </div>

              <div className="relative flex-1">
                <div className="h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-lg transition-all duration-500"
                    style={{
                      width: `${bar.percentage}%`,
                      backgroundColor: bar.color,
                    }}
                  />
                </div>

                {showValues && (
                  <div className="absolute inset-y-0 right-2 flex items-center text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {formatValue(bar.value)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vertical bar chart
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
      )}

      <div style={{ height }} className="flex items-end justify-around gap-2">
        {bars.map((bar, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative w-full">
              {showValues && (
                <div className="mb-1 text-center text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {formatValue(bar.value)}
                </div>
              )}

              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{
                  height: `${bar.percentage}%`,
                  backgroundColor: bar.color,
                  minHeight: bar.percentage > 0 ? '4px' : '0',
                }}
              />
            </div>

            <div className="w-full truncate text-center text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {bar.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
