import LocalizedLink from "@/components/navigation/LocalizedLink";

export const dynamic = "force-static";

export const metadata = {
  title: "Testimonies of Freedom — Real Stories, Real Jesus | Ruach Ministries",
  description: "Watch powerful testimonies of deliverance and redemption. Be encouraged and share the good news.",
  openGraph: { title: "Testimonies of Freedom", description: "Real stories that point to Jesus." }
};

export default async function TestimoniesOfFreedomPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15 requirement)
  await params;

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-black dark:text-white dark:shadow-none">
        <h1 className="text-3xl font-extrabold">Testimonies of Freedom</h1>
        <p className="mt-3 text-zinc-700 dark:text-white/80">Experience the power of the gospel through lives transformed by Jesus.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LocalizedLink href="/media"><span className="rounded bg-amber-500 px-5 py-2.5 text-black">Watch Now</span></LocalizedLink>
          <LocalizedLink href="/give"><span className="rounded border border-zinc-300 dark:border-white/20 bg-white dark:bg-white/10 px-5 py-2.5">Partner to Share More</span></LocalizedLink>
          <LocalizedLink href="/signup"><span className="rounded border border-zinc-300 dark:border-white/20 bg-white dark:bg-white/10 px-5 py-2.5">Get Weekly Stories</span></LocalizedLink>
        </div>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Share Your Story</h2>
        <p className="text-neutral-700">We believe testimonies carry fire. Tell us what God has done in your life and encourage others.</p>
        <LocalizedLink href="/contact"><span className="inline-flex rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black hover:bg-amber-400">Submit a Testimony</span></LocalizedLink>
      </section>
    </div>
  );
}
