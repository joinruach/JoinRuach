type Metric = {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
};

type ImpactMetricsProps = {
  metrics: Metric[];
};

export default function ImpactMetrics({ metrics }: ImpactMetricsProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-xl border border-neutral-200 bg-white p-6 space-y-2"
        >
          <div className="text-sm font-medium text-neutral-600">{metric.label}</div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-bold text-neutral-900">{metric.value}</div>
            {metric.trend && (
              <span
                className={`text-xs font-semibold ${
                  metric.trend.direction === "up" ? "text-green-600" : "text-red-600"
                }`}
              >
                {metric.trend.direction === "up" ? "↑" : "↓"} {Math.abs(metric.trend.value)}%
              </span>
            )}
          </div>
          {metric.description && (
            <p className="text-xs text-neutral-500">{metric.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
