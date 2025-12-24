export default function Loading() {
  return (
    <div className="space-y-16 animate-pulse">
      {/* Hero Skeleton */}
      <div className="space-y-6 text-center">
        <div className="mx-auto h-4 w-32 bg-white dark:bg-white/10 rounded" />
        <div className="mx-auto h-12 w-96 bg-white dark:bg-white/10 rounded" />
        <div className="mx-auto h-20 w-[600px] bg-white dark:bg-white/10 rounded" />
        <div className="mx-auto h-12 w-48 bg-white dark:bg-white/10 rounded-full" />
      </div>

      {/* Stats Skeleton */}
      <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <div className="mx-auto h-10 w-24 bg-white dark:bg-white/10 rounded" />
              <div className="mx-auto h-4 w-32 bg-white dark:bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Cards Skeleton */}
      <div className="grid gap-8 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white p-8 space-y-6">
            <div className="h-8 bg-neutral-200 rounded" />
            <div className="h-16 bg-neutral-200 rounded" />
            <div className="space-y-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="h-6 bg-neutral-200 rounded" />
              ))}
            </div>
            <div className="h-12 bg-neutral-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
