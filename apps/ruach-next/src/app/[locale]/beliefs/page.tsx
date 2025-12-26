import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "What We Believe — Ruach Ministries",
  description: "The biblical foundations of Ruach Ministries. Our core convictions about Scripture, salvation, the Holy Spirit, and the mission of the Church.",
  openGraph: {
    title: "What We Believe — Ruach Ministries",
    description: "Rooted in Scripture. Empowered by the Spirit. Sent on mission.",
  },
};

interface BeliefSectionProps {
  title: string;
  scripture?: string;
  children: React.ReactNode;
}

function BeliefSection({ title, scripture, children }: BeliefSectionProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
      <div className="mb-4 flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">{title}</h2>
        {scripture ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
            {scripture}
          </span>
        ) : null}
      </div>
      <div className="space-y-3 text-sm text-zinc-700 dark:text-white/80">{children}</div>
    </div>
  );
}

export default async function Beliefs({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Statement of Faith</span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">What We Believe</h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-700 dark:text-white/80">
          Ruach Ministries is built on the unchanging truth of Scripture, the power of the Holy Spirit, and the mission to disciple nations. We hold to historic Christian orthodoxy while emphasizing the gifts of the Spirit, deliverance ministry, and prophetic witness in these last days.
        </p>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          This statement reflects what we teach, how we pray, and why we exist. If you have questions about our theology or doctrine, reach out—we believe clarity builds trust.
        </p>
      </section>

      <div className="space-y-6">
        <BeliefSection title="The Word of God" scripture="2 Tim 3:16-17">
          <p>
            We believe the Bible—both Old and New Testaments—is the inspired, inerrant, and authoritative Word of God. Scripture is our final authority for faith, practice, and discernment.
          </p>
          <p>
            We submit all teaching, prophecy, and experience to the test of Scripture. What contradicts the Word is rejected; what aligns with it is affirmed.
          </p>
        </BeliefSection>

        <BeliefSection title="The Trinity" scripture="Matt 28:19">
          <p>
            We believe in one God eternally existing in three persons: Father, Son, and Holy Spirit. Each is fully God, co-equal and co-eternal, distinct in person but united in essence.
          </p>
          <p>
            The Father creates and sends. The Son redeems and reconciles. The Spirit empowers and sanctifies. All glory, honor, and worship belong to the Triune God alone.
          </p>
        </BeliefSection>

        <BeliefSection title="Jesus Christ" scripture="John 1:1, 14">
          <p>
            We believe Jesus Christ is the eternal Son of God, fully God and fully man. He was conceived by the Holy Spirit, born of the virgin Mary, lived a sinless life, and is the only mediator between God and humanity.
          </p>
          <p>
            He was crucified for our sins, died, was buried, and rose bodily on the third day. He ascended to the right hand of the Father and will return in power and glory to judge the living and the dead and establish His eternal Kingdom.
          </p>
        </BeliefSection>

        <BeliefSection title="Salvation by Grace Alone" scripture="Eph 2:8-9">
          <p>
            We believe salvation is a gift of God's grace, received through faith in Jesus Christ alone. No human work, ritual, or merit can earn salvation—it is the finished work of Christ applied to us by the Holy Spirit.
          </p>
          <p>
            Repentance and faith are inseparable. True saving faith produces transformation, obedience, and a life marked by holiness and love for God and neighbor.
          </p>
        </BeliefSection>

        <BeliefSection title="The Holy Spirit and His Gifts" scripture="1 Cor 12:7-11">
          <p>
            We believe the Holy Spirit indwells every believer at salvation and empowers them for witness, worship, and warfare. The gifts of the Spirit—including prophecy, healing, tongues, discernment, and miracles—are active today and given for the edification of the Church and the advancement of the Gospel.
          </p>
          <p>
            We pursue the presence and power of the Spirit while testing all manifestations by Scripture. We reject both cessationism (the belief that spiritual gifts have ceased) and emotionalism divorced from biblical truth.
          </p>
        </BeliefSection>

        <BeliefSection title="Deliverance and Spiritual Warfare" scripture="Eph 6:12">
          <p>
            We believe in the reality of Satan, demons, and spiritual oppression. Jesus came to destroy the works of the devil, and believers are called to walk in authority over the enemy through the name of Jesus, the blood of the Lamb, and the power of the Holy Spirit.
          </p>
          <p>
            Deliverance ministry is biblical, necessary, and should be conducted with discernment, humility, and accountability. We reject superstition, theatrics, and any practice that glorifies the demonic rather than Christ.
          </p>
        </BeliefSection>

        <BeliefSection title="The Church" scripture="Eph 4:11-16">
          <p>
            We believe the Church is the body of Christ, composed of all who have been born again by the Spirit. The local church exists to worship God, equip the saints, proclaim the Gospel, administer the sacraments (baptism and communion), and demonstrate the Kingdom through love, justice, and holiness.
          </p>
          <p>
            We affirm the fivefold ministry gifts (apostles, prophets, evangelists, shepherds, and teachers) and believe leadership should be biblically qualified, accountable, and servant-hearted.
          </p>
        </BeliefSection>

        <BeliefSection title="Holiness and Sanctification" scripture="1 Thess 4:3-7">
          <p>
            We believe God calls His people to holiness—set apart from sin and the patterns of this world, conformed to the image of Christ. Sanctification is both a position (we are made holy in Christ) and a process (we grow in holiness by the Spirit).
          </p>
          <p>
            We reject legalism and license. True holiness flows from love for God, not fear or performance. It produces fruit: purity, integrity, compassion, justice, and sacrificial love.
          </p>
        </BeliefSection>

        <BeliefSection title="The Great Commission" scripture="Matt 28:18-20">
          <p>
            We believe the Church is sent to make disciples of all nations, baptizing them and teaching them to obey everything Jesus commanded. This mission includes evangelism, discipleship, deliverance, compassion, and Kingdom demonstration.
          </p>
          <p>
            We are not called to merely attend church but to be the Church—bringing the presence, power, and truth of Jesus into every sphere of culture.
          </p>
        </BeliefSection>

        <BeliefSection title="The Return of Christ and Eternity" scripture="1 Thess 4:16-17">
          <p>
            We believe Jesus Christ will return visibly and bodily to judge the world, resurrect the dead, and establish His eternal Kingdom. Those who have trusted in Christ will inherit eternal life in His presence; those who have rejected Him will face eternal separation from God.
          </p>
          <p>
            We live with urgency and hope—occupying until He comes, advancing His Kingdom, and declaring His name to the ends of the earth.
          </p>
        </BeliefSection>
      </div>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Bride Over Beast: Our Ministry Philosophy
        </h2>
        <p className="mt-4 text-sm text-zinc-700 dark:text-white/80">
          Beyond core doctrine, Ruach operates under a Kingdom philosophy we call <strong>Bride Over Beast</strong>—a commitment to building on truth, intimacy, and mission instead of control, manipulation, and entertainment.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">We value intimacy over influence.</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Presence with God matters more than platform size. We refuse to sacrifice depth for reach.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">We value sending over sitting.</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              The Church is not a spectator sport. We equip believers to be sent into their cities and spheres with authority.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">We value faithfulness over virality.</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Obedience to God's voice matters more than trending content. We measure success by fruit, not metrics.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">We value discernment over hype.</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Not every movement is from God. We test everything by Scripture, affirm truth, and reject error—even when it's popular.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-zinc-900 shadow-sm dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Questions About Our Beliefs?</h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          Theology matters. If you have questions about what we teach, how we interpret Scripture, or why we hold certain convictions, we want to engage with clarity and humility.
        </p>
        <div className="mt-6">
          <a
            href="mailto:hello@joinruach.org?subject=Question About Beliefs"
            className="inline-block rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Ask a Question
          </a>
        </div>
      </section>
    </div>
  );
}
