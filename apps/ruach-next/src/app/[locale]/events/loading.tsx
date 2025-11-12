export default function EventsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200"></div>
      <div className="space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-6">
            <div className="flex gap-6">
              <div className="h-32 w-32 flex-shrink-0 rounded bg-gray-200"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 w-3/4 rounded bg-gray-200"></div>
                <div className="h-4 w-full rounded bg-gray-200"></div>
                <div className="h-4 w-5/6 rounded bg-gray-200"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
