export default function LoadingSpinner({ label="Loading…" }:{ label?: string }) {
  return (
    <div className="flex items-center gap-3 text-neutral-600">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
