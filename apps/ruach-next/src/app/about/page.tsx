import { ReactNode } from "react";
import Link from "next/link";
import { imgUrl } from "@/lib/strapi";

export const dynamic = "force-static";

const defaultBoard = [
  { name: "Marc Seals", role: "Co-Founder & Director", bio: "Film director stewarding Ruach Studios and outreach strategy." },
  { name: "Jonathan Seals", role: "Co-Founder & Bible Teacher", bio: "Leads discipleship, theology development, and Ruach Academy curriculum." },
  { name: "Advisory Pastor", role: "Board Member", bio: "Senior leader providing pastoral covering and accountability." }
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

  const statementOfFaith = [
    "We believe the Scriptures are the inspired Word of God—authoritative for faith and life.",
    "We believe in one God—Father, Son, and Holy Spirit.",
    "We believe salvation is by grace through faith in Jesus Christ, evidenced by repentance and sanctification.",
    "We believe in the baptism of the Holy Spirit, the gifts of the Spirit, and the continuing ministry of deliverance and healing.",
    "We believe in the Church as the Body of Christ, called to make disciples of all nations until Jesus returns."
  ];

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-10 text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-white/60">Who We Are</span>
        <h1 className="mt-4 text-3xl font-semibold text-white">Ruach Ministries</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          Ruach means “breath”—the Spirit of God breathing life into every story we tell, every disciple we equip, and every city we serve.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/70">
          <span>Founded: 2018</span>
          <span>•</span>
          <span>501(c)(3) Nonprofit</span>
          <span>•</span>
          <span>Base: Denham Springs, LA & Global</span>
        </div>
      </section>

      <Section title="Mission & Vision" description="The breath of God released through media, discipleship, and mercy ministry.">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Mission</h3>
            <p className="mt-3 text-sm text-white/70">
              To capture and share testimonies of Jesus, disciple believers in deliverance and holiness, and mobilize the Church to carry revival into every context.
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-lg font-semibold text-white">Vision</h3>
            <p className="mt-3 text-sm text-white/70">
              A global family living in the fear of the Lord, burning with the Spirit, and partnering with Ruach to see cities transformed by the Gospel.
            </p>
          </div>
        </div>
      </Section>

      <Section title="The Ruach Story" description="Marc and Jonathan Seals steward Ruach Studios and Ruach Ministries together as brothers.">
        <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr]">
          <div className="space-y-4 text-sm text-white/70">
            <p>
              Marc and Jonathan grew up in a ministry home marked by deliverance, prayer, and a love for Scripture. In 2018 the Lord called them to document modern-day testimonies through film—capturing deliverance, healing, and freedom stories that now reach millions globally.
            </p>
            <p>
              Out of those stories Ruach Ministries was born: a discipleship movement that pairs cinematic storytelling with courses, conferences, and outreach teams. Marc directs Ruach Studios and leads media production; Jonathan serves as Bible teacher, curriculum architect, and conference host.
            </p>
            <p>
              Today Ruach is a registered 501(c)(3) inviting partners to give, pray, and serve so we can continue releasing the breath of God.
            </p>
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

      <Section title="Board of Directors" description="Ruach Ministries is accountable to a board that safeguards theology, finances, and culture.">
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
          Have questions about theology or governance? <Link href="/contact" className="text-amber-300 hover:text-amber-200">Reach out to our team</Link>.
        </p>
      </Section>
    </div>
  );
}
