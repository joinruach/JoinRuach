import { ReactNode } from "react";
import Link from "next/link";
import { imgUrl } from "@/lib/strapi";

export const dynamic = "force-static";

const defaultBoard = [
  {
    name: "Marc Seals",
    role: "Founder & Apostolic Director",
    bio: "Marc carries the spiritual and visionary mantle of Ruach—serving as minister, storyteller, and field director who oversees the movement’s creative output, outreach, and prophetic alignment.",
  },
  {
    name: "Jonathan Seals",
    role: "Co-Founder & Executive Director",
    bio: "Jonathan architects Ruach’s discipleship and infrastructure systems, leading Ruach Academy and digital ministry initiatives to equip the remnant with Spirit-filled teaching and strategic innovation.",
  },
  {
    name: "Advisory Pastor",
    role: "Pastoral Overseer & Board Advisor",
    bio: "Provides pastoral covering, doctrinal integrity, and intercessory oversight so every Ruach initiative flows from biblical truth and the leading of the Holy Spirit.",
  },
];

function parseBoard():{ name: string; role: string; bio: string; photo?: string }[]{
  const raw = process.env.NEXT_PUBLIC_BOARD_JSON;
  if (!raw) return defaultBoard;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    return defaultBoard;
  } catch {
    return defaultBoard;
  }
}

function Section({ title, description, children }:{ title: string; description?: string; children: ReactNode }){
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        {description ? <p className="text-sm text-white/70">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function About(){
  const board = parseBoard();
  const storyImage = process.env.NEXT_PUBLIC_ABOUT_STORY_IMAGE
    ? imgUrl(process.env.NEXT_PUBLIC_ABOUT_STORY_IMAGE)
    : "/story_image_620x240_c05617fa54.png";

  const mandate = [
    "Media that breathes — storytelling that restores identity and glorifies Christ, not celebrity.",
    "Discipleship that delivers — biblical training rooted in holiness, deliverance, and the power of the Holy Spirit.",
    "Mercy that moves — compassion in action through outreach, local partnership, and house-church planting.",
  ];

  const statementOfFaith = [
    "The Scriptures are the inspired and infallible Word of Elohim—the plumbline for faith, character, and daily life.",
    "There is one Elohim: the Father, the Son (Yeshua the Messiah), and the Ruach Ha’Kodesh—eternal, holy, and perfectly one.",
    "Salvation is by grace through faith in Yeshua the Messiah, revealed through repentance, renewal, and a life set apart in righteousness.",
    "The Ruach Ha’Kodesh empowers believers to bear witness, with the gifts of the Spirit continuing as expressions of Elohim’s power and love today.",
    "Healing, deliverance, and holiness are the continuing works of Messiah through His body on earth.",
    "The Body of Messiah is called to make disciples of all nations until His glorious return.",
  ];

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-10 text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-white/60">🕊️ Who We Are</span>
        <h1 className="mt-4 text-3xl font-semibold text-white">Ruach Ministries</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          Ruach means “breath” — the Spirit of God breathing life into every story we tell, every disciple we equip, and every city we serve. We are a remnant ministry and creative house devoted to awakening identity, restoring truth, and preparing the Bride of Christ for His return.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">
          <span>Founded: 2018</span>
          <span>•</span>
          <span>Structure: 501(c)(3) Nonprofit</span>
          <span>•</span>
          <span>Base: Denham Springs, Louisiana — serving globally through digital discipleship and local outposts.</span>
        </div>
      </section>

      <Section
        title="Mission & Vision"
        description="To proclaim the testimony of Jesus through media, discipleship, and mercy—raising a generation that walks in deliverance, holiness, and power."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Mission</h3>
            <p className="mt-3 text-sm text-white/70">
              We capture authentic stories of redemption, equip believers to walk in truth and authority, and mobilize the Body to carry revival into every sphere of culture.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Vision</h3>
            <p className="mt-3 text-sm text-white/70">
              A global family of sons and daughters living in the fear of the Lord, burning with the Spirit, and building Kingdom communities that transform cities through the Gospel.
            </p>
          </div>
        </div>
      </Section>

      <Section
        title="The Ruach Story"
        description="The story of Ruach—both Ruach Studios and Ruach Ministries—is a living narrative of revival, restoration, and revelation."
      >
        <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-6 text-sm text-white/70">
            <p>
              It represents the convergence of faith, creativity, and calling between Jonathan Seals and his father, Marc Seals—a former Marine and minister whose redemption story fuels the mission.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-semibold text-white">🕊️ The Birth of Ruach</h3>
                <p className="mt-2 text-white/70">
                  Ruach was founded as a nonprofit media and ministry platform with a singular purpose: to breathe life back into faith through testimony, truth, and transformation. The name “Ruach”—Hebrew for Spirit, breath, or wind—reflects the divine presence that animates every project. What began as a father–son creative effort evolved into a spiritual movement designed to restore identity and awaken the remnant of believers around the world.
                </p>
                <p className="mt-2 text-white/70">
                  Ruach’s inception wasn’t about building another church or media brand—it was about reclaiming the digital realm for Kingdom storytelling. From testimonies like <em>False Identity</em> to teaching series such as <em>The Table</em> and <em>Thriving in Babylon</em>, every production embodies the same heartbeat: real stories, real Spirit, real change.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">🔥 The Mission and Vision</h3>
                <p className="mt-2 text-white/70">
                  Ruach exists to equip and activate the Body through creative media, discipleship, and prophetic insight. The ministry’s philosophy flows from the five-fold pattern of Ephesians 4—apostolic vision, prophetic discernment, evangelistic storytelling, pastoral care, and sound teaching—integrated into every project and community initiative.
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-white/60">
                  <li>The apostolic function builds systems, vision, and strategy.</li>
                  <li>The prophetic discerns the times and anchors content in truth.</li>
                  <li>The evangelistic shares stories that invite salvation and transformation.</li>
                  <li>The pastoral nurtures healing and family within the community.</li>
                  <li>The teaching function grounds everything in biblical doctrine and revelation.</li>
                </ul>
                <p className="mt-3 text-white/70">
                  This holistic flow turns Ruach Studios into more than a production house—it’s a digital tabernacle where the presence of God meets storytelling craft.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">👥 Gather the Remnant</h3>
                <p className="mt-2 text-white/70">
                  Every Ruach initiative—from teaching series to remnant gatherings—is designed to send, not just stream. The goal is activation, not accumulation: turning viewers into vessels who carry the breath of God into their cities and communities.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">💎 The Ruach Philosophy: Bride Over Beast</h3>
                <p className="mt-2 text-white/70">
                  Central to the Ruach story is a prophetic worldview known as the “Bride Over Beast” strategy—a Kingdom architecture that stands in contrast to Babylon’s systems. Where the “Beast” builds control, manipulation, and hype, the “Bride” builds truth, discernment, and mission.
                </p>
                <ul className="mt-3 list-disc space-y-2 pl-5 text-white/60">
                  <li>Authentic witness over entertainment.</li>
                  <li>Sending over sitting—every project is a launchpad, not a stage.</li>
                  <li>Intimacy over influence—valuing presence over platform metrics.</li>
                  <li>Preparation over panic—building communities rooted in peace and readiness.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">📖 The Remnant Canon</h3>
                <p className="mt-2 text-white/70">
                  Through works like <em>The Ruach Study Canon</em> and <em>The Remnant Guidebook</em>, the ministry curates a discipleship pathway that spans truth, healing, identity, warfare, and mission. It is a response to what we call biblical malnutrition—an intentional effort to restore substance where hype once reigned.
                </p>
                <p className="mt-2 text-white/70">
                  Each canon phase moves believers from information to transformation, building biblical literacy, prophetic discernment, and Kingdom authority.
                </p>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">🌍 A Living Story</h3>
                <p className="mt-2 text-white/70">
                  The Ruach story is ongoing—unfolding through media, gatherings, and relationships. Marc and Jonathan Seals now stand not only as father and son but as co-laborers in a prophetic mission: to prepare the Bride, gather the remnant, and release the Spirit through every screen, sound, and story.
                </p>
                <p className="mt-2 text-white/70">
                  Ruach isn’t just a ministry—it’s a movement of breath. A call for sons and daughters to awaken, arise, and reflect the Light in an age of distortion.
                </p>
              </div>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
            {storyImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={storyImage} alt="Marc & Jonathan Seals" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-white/50">
                Add `NEXT_PUBLIC_ABOUT_STORY_IMAGE` to display a photo of Marc & Jonathan.
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title="The Ruach Mandate" description="Ruach carries a threefold mantle:">
        <ul className="space-y-3 text-sm text-white/70">
          {mandate.map((item) => (
            <li key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-white/60">
          Our rhythm mirrors the Acts church: house to house, heart to heart, and screen to soul.
        </p>
      </Section>

      <Section title="Leadership & Accountability" description="Ruach Ministries is accountable to a board that safeguards theology, finances, and culture.">
        <div className="grid gap-6 md:grid-cols-3">
          {board.map((member) => (
            <div key={member.name} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              {member.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.photo} alt={member.name} className="mb-4 h-32 w-full rounded-2xl object-cover" />
              ) : null}
              <div className="text-lg font-semibold text-white">{member.name}</div>
              <div className="text-xs uppercase tracking-wide text-white/50">{member.role}</div>
              <p className="mt-3 text-sm text-white/70">{member.bio}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Statement of Faith">
        <ol className="space-y-3 text-sm text-white/70">
          {statementOfFaith.map((item) => (
            <li key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              {item}
            </li>
          ))}
        </ol>
        <p className="mt-6 text-sm text-white/60">
          Have questions about theology, discipleship, or governance?{" "}
          <Link href="/contact" className="text-amber-300 hover:text-amber-200">
            Reach out to our team
          </Link>{" "}
          —we’d love to walk with you as the Breath of God continues to move.
        </p>
      </Section>
    </div>
  );
}
