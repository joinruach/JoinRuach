export default function Loading() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-32 bg-white/10 rounded" />
        <div className="h-10 w-64 bg-white/10 rounded" />
        <div className="h-4 w-96 bg-white/10 rounded" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="aspect-video mb-4 bg-white/10 rounded-lg" />
            <div className="h-6 bg-white/10 rounded mb-2" />
            <div className="h-4 bg-white/10 rounded mb-3" />
            <div className="h-3 w-20 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
