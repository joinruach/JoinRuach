export type Badge = { label: string; icon?: React.ReactNode; earnedAt?: string };
export default function BadgesDisplay({ badges }:{ badges: Badge[] }) {
  if (!badges.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((b,i)=>(
        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
          {b.icon ?? "🏅"} {b.label}
        </span>
      ))}
    </div>
  );
}
