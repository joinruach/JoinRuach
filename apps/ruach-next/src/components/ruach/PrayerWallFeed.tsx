import { getPrayers } from "@/lib/strapi";

export default async function PrayerWallFeed() {
  const prayers = await getPrayers(6);
  if (!prayers?.length) return null;
  return (
    <div className="rounded-2xl border border-black/10 bg-neutral-50 p-5">
      <h3 className="mb-3 text-lg font-semibold">Live Prayer Wall</h3>
      <ul className="space-y-3">
        {prayers.map((p:any) => (
          <li key={p.id} className="rounded-xl border border-black/5 bg-white p-4">
            <div className="mb-1 text-xs text-neutral-500">
              {p.attributes?.createdAt ? new Date(p.attributes.createdAt).toLocaleString() : ""}
            </div>
            <div className="leading-relaxed">{p.attributes?.body}</div>
          </li>
        ))}
      </ul>
      <a className="mt-4 inline-block underline" href="/contact">Post a prayer →</a>
    </div>
  );
}

