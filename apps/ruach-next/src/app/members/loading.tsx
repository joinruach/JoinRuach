export default function MembersLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 animate-pulse">
        <div className="mb-4 h-8 w-64 rounded bg-gray-200"></div>
        <div className="h-4 w-96 rounded bg-gray-200"></div>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6 animate-pulse rounded-lg border p-6">
            <div className="mb-4 h-6 w-48 rounded bg-gray-200"></div>
            <div className="space-y-3">
              <div className="h-4 rounded bg-gray-200"></div>
              <div className="h-4 rounded bg-gray-200"></div>
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
        <div className="animate-pulse rounded-lg border p-6">
          <div className="mb-4 h-6 rounded bg-gray-200"></div>
          <div className="space-y-3">
            <div className="h-4 rounded bg-gray-200"></div>
            <div className="h-4 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
