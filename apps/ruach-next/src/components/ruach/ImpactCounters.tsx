import { getImpactStats } from "@/lib/strapi";

export default async function ImpactCounters() {
  const stats = await getImpactStats();
  if (!stats) return null;

  const { headline, body, metrics = [] } = stats.attributes as {
    headline?: string;
    body?: string;
    metrics?: Array<{ label: string; value: string; description?: string }>;
  };

  if (!metrics.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      {(headline || body) && (
        <div className="text-center">
          {headline ? (
            <h2 className="text-2xl font-semibold text-white">{headline}</h2>
          ) : null}
          {body ? (
            <p className="mt-2 text-sm text-white/70">{body}</p>
          ) : null}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white">
            <div className="text-4xl font-extrabold">{metric.value}</div>
            <div className="mt-1 text-sm uppercase tracking-wide text-white/60">{metric.label}</div>
            {metric.description ? (
              <p className="mt-2 text-xs text-white/60">{metric.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
