"use client";

import { useMemo } from 'react';

interface PieDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieDataPoint[];
  size?: number;
  showLegend?: boolean;
  title?: string;
}

const DEFAULT_COLORS = [
  '#f59e0b', // amber-500
  '#3b82f6', // blue-500
  '#10b981', // green-500
  '#ef4444', // red-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

/**
 * PieChart Component
 *
 * Renders a responsive pie/donut chart with legend.
 *
 * @example
 * ```tsx
 * <PieChart
 *   data={[
 *     { label: 'Mobile', value: 12340 },
 *     { label: 'Desktop', value: 8920 },
 *     { label: 'Tablet', value: 3240 },
 *   ]}
 *   title="Devices"
 * />
 * ```
 */
export default function PieChart({
  data,
  size = 200,
  showLegend = true,
  title,
}: PieChartProps) {
  const { total, slices } = useMemo(() => {
    if (!data || data.length === 0) {
      return { total: 0, slices: [] };
    }

    const total = data.reduce((sum, d) => sum + d.value, 0);

    let currentAngle = -90; // Start at top

    const slices = data.map((d, i) => {
      const percentage = total > 0 ? (d.value / total) * 100 : 0;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;

      return {
        ...d,
        color: d.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        percentage,
        angle,
        startAngle,
        endAngle: currentAngle,
      };
    });

    return { total, slices };
  }, [data]);

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  // Helper to calculate arc path
  const describeArc = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ): string => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      'L',
      centerX,
      centerY,
      'Z',
    ].join(' ');
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900"
        style={{ height: size }}
      >
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No data available</p>
      </div>
    );
  }

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 10;
  const donutRadius = radius * 0.6;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      {title && (
        <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
      )}

      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
        {/* Chart */}
        <div className="flex-shrink-0">
          <svg width={size} height={size} className="transform transition-transform hover:scale-105">
            {/* Slices */}
            {slices.map((slice, i) => (
              <g key={i}>
                <path
                  d={describeArc(centerX, centerY, radius, slice.startAngle, slice.endAngle)}
                  fill={slice.color}
                  className="transition-opacity hover:opacity-80"
                />
              </g>
            ))}

            {/* Donut hole */}
            <circle cx={centerX} cy={centerY} r={donutRadius} fill="currentColor" className="text-white dark:text-neutral-900" />

            {/* Center text */}
            <text
              x={centerX}
              y={centerY - 5}
              textAnchor="middle"
              className="fill-current text-xs font-semibold text-neutral-600 dark:text-neutral-400"
            >
              Total
            </text>
            <text
              x={centerX}
              y={centerY + 10}
              textAnchor="middle"
              className="fill-current text-lg font-bold text-neutral-900 dark:text-neutral-100"
            >
              {formatValue(total)}
            </text>
          </svg>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex-1 space-y-2">
            {slices.map((slice, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 flex-shrink-0 rounded-sm"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {slice.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatValue(slice.value)}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-500">
                    ({slice.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
