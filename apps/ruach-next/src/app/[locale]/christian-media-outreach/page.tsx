import Link from "next/link";

export const dynamic = "force-static";

export const metadata = {
  title: "Christian Media Outreach — Share the Gospel Globally | Ruach Ministries",
  description: "Partner with Ruach to create testimonies, teachings, and content that changes lives across the world.",
  openGraph: { title: "Christian Media Outreach — Global Impact", description: "Create testimonies and teachings that change lives." }
};

export default function ChristianMediaOutreachPage(){
  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-black p-8 text-white">
        <h1 className="text-3xl font-extrabold">Christian Media Outreach — Global Impact</h1>
        <p className="mt-3 text-white/80">Your giving fuels production, storytelling, and digital missions so more people meet Jesus.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/give" className="rounded bg-amber-500 px-5 py-2.5 text-black">Fuel the Mission</Link>
          <Link href="/media" className="rounded border border-white/20 bg-white/10 px-5 py-2.5">Watch the Stories</Link>
          <Link href="/about" className="rounded border border-white/20 bg-white/10 px-5 py-2.5">Meet the Team</Link>
        </div>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Why Media Matters</h2>
        <p className="text-neutral-700">From short-form testimony clips to long-form teachings, we’re building a content library that disciples and evangelizes at scale.</p>
      </section>
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <h3 className="font-semibold">Your Impact</h3>
        <ul className="mt-2 list-disc pl-5 text-neutral-700">
          <li>Production hours funded</li>
          <li>Global reach via social and web</li>
          <li>New believers discipled through stories</li>
        </ul>
        <Link href="/give" className="mt-4 inline-flex rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black hover:bg-amber-400">Give Today</Link>
      </section>
    </div>
  );
}

