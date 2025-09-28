export default function ProgressTracker({ completed, total }:{ completed: number; total: number }) {
  const pct = total > 0 ? Math.round((completed/total)*100) : 0;
  return (
    <div className="rounded-xl border border-black/10 p-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-600">Course Progress</div>
        <div className="text-sm font-semibold">{pct}%</div>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
        <div style={{ width: `${pct}%` }} className="h-2 rounded-full bg-amber-500" />
      </div>
      <div className="mt-1 text-xs text-neutral-500">{completed} of {total} lessons completed</div>
    </div>
  );
}
