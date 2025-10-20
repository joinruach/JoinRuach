export type Donor = { name: string; amount?: number; message?: string; createdAt?: string; showAmount?: boolean };
const amountFormatter = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0 });
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

export default function DonorWall({ donors }:{ donors: Donor[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {donors.map((d,i)=>(
        <div key={i} className="rounded-xl bg-neutral-50 p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">{d.name}</div>
            {d.showAmount && d.amount ? <div className="text-sm text-neutral-600">${amountFormatter.format(d.amount)}</div> : null}
          </div>
          {d.message && <p className="mt-1 text-sm text-neutral-700">“{d.message}”</p>}
          {d.createdAt && (
            <div className="mt-1 text-xs text-neutral-500">
              <time dateTime={d.createdAt} suppressHydrationWarning>{dateFormatter.format(new Date(d.createdAt))}</time>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
