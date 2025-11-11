export default function CoursesLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 h-8 w-48 animate-pulse rounded bg-gray-200"></div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border p-6">
            <div className="mb-4 h-48 rounded bg-gray-200"></div>
            <div className="mb-2 h-6 rounded bg-gray-200"></div>
            <div className="h-4 rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
