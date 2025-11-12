export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-4">
        <div className="h-10 w-32 bg-white/10 rounded" />
        <div className="flex gap-3">
          <div className="flex-1 h-12 bg-white/10 rounded-full" />
          <div className="h-12 w-32 bg-white/10 rounded-full" />
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-24 bg-white/10 rounded-full" />
          ))}
        </div>
      </div>

      {/* Results Skeleton */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="h-24 w-32 rounded-lg bg-white/10" />
            <div className="flex-1 space-y-2">
              <div className="h-6 w-3/4 rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-3 w-32 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
