import Link from "next-intl/link";

export const dynamic = "force-static";

export const metadata = {
  title: "Deliverance Ministry — Find Freedom in Christ | Ruach Ministries",
  description: "Biblical deliverance teaching, testimonies of freedom, and practical steps to walk free in Christ. Join the movement and partner to set captives free.",
  openGraph: {
    title: "Deliverance Ministry — Find Freedom in Christ",
    description: "Biblical deliverance teaching, testimonies of freedom, and practical next steps.",
  }
};

export default async function DeliveranceMinistryPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15 requirement)
  await params;

  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-black p-8 text-white">
        <h1 className="text-3xl font-extrabold">Deliverance Ministry — Find Freedom in Christ</h1>
        <p className="mt-3 text-white/80">Jesus still sets captives free. Discover the truth, receive ministry, and walk it out daily.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/give" className="rounded bg-amber-500 px-5 py-2.5 text-black">Give to Set People Free</Link>
          <Link href="/media" className="rounded border border-white/20 bg-white/10 px-5 py-2.5">Watch Testimonies</Link>
          <Link href="/courses" className="rounded border border-white/20 bg-white/10 px-5 py-2.5">Learn Biblical Deliverance</Link>
        </div>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">What the Bible Says</h2>
        <p className="text-neutral-700">We ground everything in Scripture. Explore teachings, practical steps, and testimonies that point to Jesus as Deliverer.</p>
      </section>
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <h3 className="font-semibold">Take Your Next Step</h3>
        <ul className="mt-2 list-disc pl-5 text-neutral-700">
          <li>Watch freedom stories from real people</li>
          <li>Study key passages and renew your mind</li>
          <li>Partner with us to reach more families</li>
        </ul>
        <Link href="/give" className="mt-4 inline-flex rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black hover:bg-amber-400">Partner Monthly</Link>
      </section>
    </div>
  );
}

