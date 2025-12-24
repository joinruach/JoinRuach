/* eslint-disable react/no-unescaped-entities */
import { ReactNode } from "react";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Carry the Fire — A Builder & Sender Invitation | Ruach Ministries",
  description: "If God is calling you to replicate, lead, or carry what He's doing through Ruach into new places, we want to equip and send you.",
  openGraph: {
    title: "Carry the Fire — A Builder & Sender Invitation",
    description: "An invitation for those called not just to follow, but to build, replicate, and send.",
  },
};

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/90 p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">{title}</h2>
        {description ? <p className="text-sm text-zinc-600 dark:text-white/70">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function CheckItem({ children, type = "will" }: { children: ReactNode; type?: "will" | "wont" }) {
  const icon = type === "will" ? "✅" : "❌";
  return (
    <li className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <span className="text-sm text-zinc-600 dark:text-white/70">{children}</span>
    </li>
  );
}

export default async function CarryTheFire({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15 requirement)
  await params;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-10 text-zinc-900 shadow-sm dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-white dark:shadow-none">
        <span className="text-xs uppercase tracking-[0.35em] text-amber-800/80 dark:text-amber-300/80">🔥 Carry the Fire</span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">A Builder & Sender Invitation</h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-700 dark:text-white/80">
          If God is calling you to replicate, lead, or carry what He's doing through Ruach into new places, we want to equip and send you.
        </p>
        <p className="mt-4 max-w-3xl text-sm text-zinc-600 dark:text-white/70">
          This page is for those who don't just want to watch—you want to build, plant, and multiply what the Spirit is doing.
        </p>
      </section>

      {/* Not for Everyone */}
      <Section title="This Is Not for Everyone (And That's Okay)">
        <div className="space-y-4 text-sm text-zinc-700 dark:text-white/70">
          <p>
            Not everyone who encounters Ruach is called to build with it. Most will watch, learn, grow, give, and participate—and that is faithful. That is Kingdom work.
          </p>
          <p>
            But some of you are carrying something heavier.
          </p>
          <p>
            You don't just resonate with what Ruach is doing. You feel the weight of doing it yourself—in your city, your church, your sphere. You're not looking for content to consume. You're looking for a model to replicate, a framework to adapt, or a kindred mission to walk alongside.
          </p>
          <div className="mt-6 space-y-3">
            <p className="text-zinc-700 dark:text-white/80">You've been asking questions like:</p>
            <ul className="space-y-2 pl-5">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>"Can I use these resources to disciple others?"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>"Could this work in my context?"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>"How do I start something like this where I am?"</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>"Is there a way to partner beyond giving money?"</span>
              </li>
            </ul>
          </div>
          <p className="mt-6 text-base text-zinc-800 dark:text-white/90">
            If that's you, this page is for you.
          </p>
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-zinc-800 shadow-sm dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-white/90 dark:shadow-none">
            <strong>Builders aren't more spiritual—they're simply called to replicate, lead, or carry what God is doing into new places.</strong>
          </p>
          <p className="mt-4">
            And Ruach wants to equip and release you—not control you.
          </p>
        </div>
      </Section>

      {/* What It Means to Build */}
      <Section title="What It Means to Build with Ruach">
        <p className="mb-6 text-sm text-zinc-600 dark:text-white/70">
          Building with Ruach doesn't mean becoming an employee, franchise, or satellite campus. It means you're carrying the same fire in a different field.
        </p>
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">You Share the Same Foundation</h3>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-white/70 pl-5">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Biblical authority and the fear of the Lord</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Deliverance, discipleship, and the gifts of the Spirit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>A commitment to truth over trend, intimacy over influence</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>The "Bride Over Beast" posture—building Kingdom communities that reflect holiness, not Babylon's systems</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">You Adapt the Model to Your Context</h3>
            <p className="mt-4 text-sm text-zinc-600 dark:text-white/70">
              Ruach is not a template to copy. It's a breath to carry. You take what God is doing here and translate it into your setting—whether that's:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-white/70 pl-5">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Leading a house church or small group</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Filming testimonies in your city</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Training believers in deliverance and spiritual warfare</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Planting a local outreach initiative</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Launching discipleship courses in your language or culture</span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-zinc-600 dark:text-white/70">
              You're not replicating Ruach Ministries. You're replicating the <em>pattern</em>: media that awakens, teaching that forms, and mission that sends.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">You Build in Relationship, Not Isolation</h3>
            <p className="mt-4 text-sm text-zinc-600 dark:text-white/70">
              We're not franchising. We're not overseeing. But we are available.
            </p>
            <p className="mt-4 text-sm text-zinc-600 dark:text-white/70">
              If you're building something aligned with Ruach's mission and theology, we want to:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-700 dark:text-white/70 pl-5">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Pray with you</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Share what we've learned (both victories and failures)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Point you to resources, frameworks, and training</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Stay connected as partners in the field, not as gatekeepers over your calling</span>
              </li>
            </ul>
            <p className="mt-4 text-sm text-zinc-600 dark:text-white/70">
              This is relational sending, not organizational control.
            </p>
          </div>
        </div>
      </Section>

      {/* What We Will and Won't Do */}
      <Section
        title="What Ruach Will (and Won't) Do for Builders"
        description="Let's be clear about expectations so no one builds on false assumptions."
      >
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">✅ What Ruach Will Do</h3>
            <ul className="space-y-3">
              <CheckItem type="will">
                <strong className="text-zinc-900 dark:text-white">Equip you spiritually and practically.</strong> You can access our courses, testimonies, and frameworks. Use them. Teach them. Adapt them. We ask only that you steward what you use with integrity, accountability, and faithfulness to Scripture.
              </CheckItem>
              <CheckItem type="will">
                <strong className="text-zinc-900 dark:text-white">Walk with you relationally.</strong> If you reach out, we'll connect. We'll listen, advise, and pray. We're not building an empire—we're equipping laborers.
              </CheckItem>
              <CheckItem type="will">
                <strong className="text-zinc-900 dark:text-white">Share what we know.</strong> We've learned a lot building this ministry (media production, discipleship design, outreach strategy, tech infrastructure). We'll share openly what's helped us.
              </CheckItem>
              <CheckItem type="will">
                <strong className="text-zinc-900 dark:text-white">Celebrate what God does through you.</strong> When you carry the fire and see breakthrough, we want to hear about it. Your fruit glorifies the same King.
              </CheckItem>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">❌ What Ruach Won't Do</h3>
            <ul className="space-y-3">
              <CheckItem type="wont">
                <strong className="text-zinc-900 dark:text-white">We won't fund your vision.</strong> Ruach is a nonprofit. We steward what God has entrusted to us, and we trust God to provide for what He's calling you to build.
              </CheckItem>
              <CheckItem type="wont">
                <strong className="text-zinc-900 dark:text-white">We won't oversee or manage you.</strong> You answer to the Lord and your local covering, not to Ruach. We're not a denomination or network headquarters.
              </CheckItem>
              <CheckItem type="wont">
                <strong className="text-zinc-900 dark:text-white">We won't guarantee scale or success.</strong> Faithfulness is the win. Some plantings grow fast. Some grow slow. Some bear fruit you'll never see this side of eternity. Obedience is what matters.
              </CheckItem>
              <CheckItem type="wont">
                <strong className="text-zinc-900 dark:text-white">We won't make you us.</strong> You're not joining Ruach's staff or becoming a "Ruach chapter." You're being sent by the same Spirit to do Kingdom work in your context.
              </CheckItem>
            </ul>
          </div>
        </div>
      </Section>

      {/* The Responsibility */}
      <Section title="The Responsibility You Carry">
        <p className="mb-6 text-sm text-zinc-600 dark:text-white/70">
          If you're going to build, you need to count the cost.
        </p>
        <p className="mb-6 text-sm text-zinc-600 dark:text-white/70">
          This isn't about excitement or influence. It's about stewardship, endurance, and spiritual warfare.
        </p>
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">You Will Be Tested</h3>
            <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
              Planting anything Kingdom-oriented invites resistance. You'll face spiritual opposition, relational friction, and seasons of discouragement. If you're not grounded in the Word, covered in prayer, and walking in holiness, you won't last.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">You Will Be Accountable</h3>
            <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
              Not to Ruach—but to God and to the local body He's placed you in. If you're not under pastoral covering, in biblical community, and submitted to spiritual authority, do not attempt to build. Independence is not the same as apostolic sending.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">You Will Need to Die to Self</h3>
            <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
              Building Kingdom work means your name doesn't matter. Your platform doesn't matter. Whether anyone ever knows what you did doesn't matter. Only Jesus gets the glory. If you're building for recognition, influence, or validation, this will break you—and it should.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">You Will Have to Persevere</h3>
            <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
              Most ministry is slow, hidden, and repetitive. Testimonies come one at a time. Disciples take years to form. Breakthroughs are real but rare. If you're looking for quick wins or viral moments, you're chasing the wrong kingdom.
            </p>
          </div>
        </div>
        <p className="mt-6 text-base text-zinc-800 dark:text-white/90">
          If that doesn't scare you—if it actually confirms the weight you've been carrying—then you might be ready.
        </p>
      </Section>

      {/* How to Begin */}
      <Section title="How to Begin (Next Steps)">
        <p className="mb-6 text-sm text-zinc-600 dark:text-white/70">
          This is relational, not transactional. We're not collecting applications. We're discerning callings.
        </p>
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Reach Out</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
                  Send us a message through our <LocalizedLink href="/contact"><span className="text-amber-700 hover:text-amber-800 underline dark:text-amber-300 dark:hover:text-amber-200">contact page</span></LocalizedLink>. Tell us:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-zinc-700 dark:text-white/70 pl-5">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                    <span>Who you are and where you're located</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                    <span>What God is stirring in you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                    <span>What you sense He's calling you to build</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                    <span>How you see alignment with Ruach's mission</span>
                  </li>
                </ul>
                <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
                  We'll respond personally. This is not about approval—it's about discernment and relationship.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Get to Know Ruach Deeply</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
                  Before you build with us, spend time in what we've already built:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-zinc-700 dark:text-white/70 pl-5">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                    <span>Watch testimonies. Take courses. Read our <LocalizedLink href="/about"><span className="text-amber-700 hover:text-amber-800 underline dark:text-amber-300 dark:hover:text-amber-200">About page</span></LocalizedLink>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                    <span>Understand the "Bride Over Beast" framework.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                    <span>Make sure you're theologically and spiritually aligned before moving forward.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Build Relationship Over Time</h3>
                <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
                  If there's alignment, we'll stay in touch. We'll pray together. We'll talk through what you're building. We'll offer counsel and support as the Spirit leads.
                </p>
                <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
                  This is not a program. It's a partnership. And partnerships take time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Final Word */}
      <Section title="A Final Word">
        <div className="space-y-4 text-sm text-zinc-700 dark:text-white/70">
          <p>
            Ruach Ministries exists to form, equip, and <strong className="text-zinc-900 dark:text-white">send</strong>.
          </p>
          <p>
            We're not gathering a crowd. We're preparing a remnant.
          </p>
          <p>
            If God is calling you to carry the fire—to take what He's doing here and multiply it in your field—we want to equip you, bless you, and release you.
          </p>
          <p>
            Not as our employee. Not as our franchise. But as our brother or sister, co-laboring in the same harvest for the same King.
          </p>
          <p className="mt-6 text-base text-zinc-800 dark:text-white/90">
            <strong className="text-zinc-900 dark:text-white">The question is not whether you're capable.</strong>
            <br />
            <strong className="text-zinc-900 dark:text-white">The question is whether you're called.</strong>
          </p>
          <p className="mt-4">
            If the answer is yes—and you've counted the cost—reach out.
          </p>
          <p className="mt-4 text-zinc-800 dark:text-white/90">
            We're here.
          </p>
        </div>
      </Section>

      {/* Ready CTA */}
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-zinc-900 shadow-sm dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Ready to Take the Next Step?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <LocalizedLink href="/contact">
            <span className="inline-block rounded-full bg-amber-600 px-8 py-3 font-semibold text-zinc-900 dark:text-white transition-all hover:bg-amber-700 dark:bg-amber-500/30 dark:hover:bg-amber-500/40">
              Contact Us
            </span>
          </LocalizedLink>
          <LocalizedLink href="/about">
            <span className="inline-block rounded-full border border-amber-200 bg-white px-6 py-3 font-medium text-amber-900 transition-all hover:bg-amber-100 dark:border-transparent dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
              Read Our Story
            </span>
          </LocalizedLink>
          <LocalizedLink href="/courses">
            <span className="inline-block rounded-full border border-amber-200 bg-white px-6 py-3 font-medium text-amber-900 transition-all hover:bg-amber-100 dark:border-transparent dark:bg-white/10 dark:text-white dark:hover:bg-white/20">
              Explore Resources
            </span>
          </LocalizedLink>
        </div>
      </section>
    </div>
  );
}
