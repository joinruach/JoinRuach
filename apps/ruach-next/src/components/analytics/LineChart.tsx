"use client";

import { useMemo } from 'react';

interface DataPoint {
  date: string;
  value: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
  color?: string;
  label?: string;
}

/**
 * LineChart Component
 *
 * Renders a responsive line chart using SVG.
 *
 * @example
 * ```tsx
 * <LineChart
 *   data={[
 *     { date: '2025-01-01', value: 100 },
 *     { date: '2025-01-02', value: 150 },
 *   ]}
 *   label="Views"
 *   color="#f59e0b"
 * />
 * ```
 */
export default function LineChart({
  data,
  height = 300,
  showGrid = true,
  showDots = false,
  color = '#f59e0b',
  label,
}: LineChartProps) {
  const { path, points, yScale, xScale } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: '', points: [], yScale: { min: 0, max: 100 }, xScale: [] };
    }

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const padding = 40;
    const chartHeight = height - padding * 2;
    const chartWidth = 100; // Will use viewBox percentage

    const yScale = { min, max, range };

    // Calculate points
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * chartWidth;
      const y = chartHeight - ((d.value - min) / range) * chartHeight;
      return { x, y, value: d.value, date: d.date };
    });

    // Create SVG path
    const pathCommands = points.map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      return `L ${p.x} ${p.y}`;
    });
    const path = pathCommands.join(' ');

    // X-axis scale (show ~5 labels)
    const labelCount = Math.min(5, data.length);
    const step = Math.floor(data.length / labelCount);
    const xScale = data
      .filter((_, i) => i % step === 0 || i === data.length - 1)
      .map((d) => d.date);

    return { path, points, yScale, xScale };
  }, [data, height]);

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      {label && (
        <h3 className="mb-4 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {label}
        </h3>
      )}

      <div className="relative" style={{ height }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          {/* Grid lines */}
          {showGrid && (
            <g className="text-neutral-200 dark:text-neutral-700">
              {[0, 25, 50, 75, 100].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="currentColor"
                  strokeWidth="0.1"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </g>
          )}

          {/* Area fill */}
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <path
            d={`${path} L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`}
            fill="url(#chartGradient)"
          />

          {/* Line */}
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Dots */}
          {showDots &&
            points.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r="0.8"
                fill={color}
                vectorEffect="non-scaling-stroke"
              />
            ))}
        </svg>

        {/* Y-axis labels */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between py-2 pr-2 text-xs text-neutral-600 dark:text-neutral-400">
          <span>{formatValue(yScale.max)}</span>
          <span>{formatValue((yScale.max + yScale.min) / 2)}</span>
          <span>{formatValue(yScale.min)}</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="mt-2 flex justify-between px-8 text-xs text-neutral-600 dark:text-neutral-400">
        {xScale.map((date, i) => (
          <span key={i}>{formatDate(date)}</span>
        ))}
      </div>
    </div>
  );
}
