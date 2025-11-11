export default function OutreachLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 animate-pulse">
        <div className="mb-4 h-10 w-64 rounded bg-gray-200"></div>
        <div className="h-5 w-96 rounded bg-gray-200"></div>
      </div>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-6">
            <div className="mb-4 h-48 rounded bg-gray-200"></div>
            <div className="mb-3 h-6 rounded bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-4 rounded bg-gray-200"></div>
              <div className="h-4 w-5/6 rounded bg-gray-200"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
