import Link from "next/link";

export const dynamic = "force-static";

export const metadata = {
  title: "Testimonies of Freedom — Real Stories, Real Jesus | Ruach Ministries",
  description: "Watch powerful testimonies of deliverance and redemption. Be encouraged and share the good news.",
  openGraph: { title: "Testimonies of Freedom", description: "Real stories that point to Jesus." }
};

export default function TestimoniesOfFreedomPage(){
  return (
    <div className="space-y-8">
      <header className="rounded-2xl bg-black p-8 text-white">
        <h1 className="text-3xl font-extrabold">Testimonies of Freedom</h1>
        <p className="mt-3 text-white/80">Experience the power of the gospel through lives transformed by Jesus.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/media" className="rounded bg-amber-500 px-5 py-2.5 text-black">Watch Now</Link>
          <Link href="/give" className="rounded border border-white/20 bg-white/10 px-5 py-2.5">Partner to Share More</Link>
          <Link href="/signup" className="rounded border border-white/20 bg-white/10 px-5 py-2.5">Get Weekly Stories</Link>
        </div>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-bold">Share Your Story</h2>
        <p className="text-neutral-700">We believe testimonies carry fire. Tell us what God has done in your life and encourage others.</p>
        <a href="/contact" className="inline-flex rounded-lg bg-amber-500 px-4 py-2 font-semibold text-black hover:bg-amber-400">Submit a Testimony</a>
      </section>
    </div>
  );
}

