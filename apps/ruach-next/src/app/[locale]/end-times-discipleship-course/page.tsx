import Link from "next/link";

export const dynamic = "force-static";

export const metadata = {
  title: "End Times Discipleship Course — Prepare Your Heart | Ruach Ministries",
  description: "Biblical, practical training for thriving in challenging times. Study, pray, and grow in boldness.",
  openGraph: { title: "End Times Discipleship Course", description: "Biblical, practical training for these times." }
};

export default async function EndTimesCourseLanding({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15 requirement)
  await params;

  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-black p-8 text-white">
        <h1 className="text-3xl font-extrabold">End Times Discipleship Course</h1>
        <p className="mt-3 text-white/80">Grow in faithfulness, hope, and clarity. Jesus is returning — we prepare in love.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/courses" className="rounded bg-amber-500 px-5 py-2.5 text-black">Explore the Course</Link>
          <Link href="/give" className="rounded border border-white/20 bg-white/10 px-5 py-2.5">Support the Teaching</Link>
          <Link href="/signup" className="rounded border border-white/20 bg-white/10 px-5 py-2.5">Get Study Guides</Link>
        </div>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">What You’ll Learn</h2>
        <ul className="list-disc pl-5 text-neutral-700">
          <li>Biblical themes of perseverance and holiness</li>
          <li>How to pray, fast, and witness with boldness</li>
          <li>How to stand firm and serve your community</li>
        </ul>
      </section>
    </div>
  );
}

