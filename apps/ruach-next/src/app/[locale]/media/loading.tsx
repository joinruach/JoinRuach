export default function MediaLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200"></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="mb-3 aspect-video rounded bg-gray-200"></div>
            <div className="mb-2 h-5 rounded bg-gray-200"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
