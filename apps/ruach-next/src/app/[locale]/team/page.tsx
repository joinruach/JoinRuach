import type { Metadata } from "next";
import Image from "next/image";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Leadership & Team — Ruach Ministries",
  description: "Meet the leaders and team members who steward Ruach Ministries. Called to serve, sent to equip, committed to faithfulness.",
  openGraph: {
    title: "Leadership & Team — Ruach Ministries",
    description: "Faces behind the ministry. Hearts for the mission.",
  },
};

interface TeamMemberProps {
  name: string;
  role: string;
  bio: string;
  imagePlaceholder?: string;
}

function TeamMember({ name, role, bio, imagePlaceholder }: TeamMemberProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
      <div className="mb-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-zinc-200 dark:bg-white/10">
        {imagePlaceholder ? (
          <div className="text-4xl">{imagePlaceholder}</div>
        ) : (
          <div className="text-sm text-zinc-500 dark:text-white/60">Photo</div>
        )}
      </div>
      <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">{name}</h3>
      <div className="mt-1 text-sm font-medium text-amber-600 dark:text-amber-400">{role}</div>
      <p className="mt-4 text-sm text-zinc-600 dark:text-white/70">{bio}</p>
    </div>
  );
}

interface BoardMemberProps {
  name: string;
  title: string;
  description: string;
}

function BoardMember({ name, title, description }: BoardMemberProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="font-semibold text-zinc-900 dark:text-white">{name}</div>
      <div className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">{title}</div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">{description}</p>
    </div>
  );
}

export default async function Team({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Our Team</span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">
          Leadership & Team
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-700 dark:text-white/80">
          Ruach Ministries is led by a team of servants who love Jesus, steward His presence, and believe the Church is meant to advance the Kingdom—not just attend services.
        </p>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          We're not building a platform or celebrity brand. We're preparing a people—equipping them in the Word, releasing them in the Spirit, and sending them on mission. Every leader on this team is accountable, submitted to Scripture, and committed to laying down their lives for the sake of the Gospel.
        </p>
      </section>

      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Core Leadership</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
            The leaders who shepherd Ruach Ministries day-to-day, carrying vision, teaching, and pastoral oversight.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <TeamMember
            name="[Founder/Director Name]"
            role="Founder & Executive Director"
            bio="[Brief bio: calling to ministry, heart for discipleship and deliverance, vision for Ruach. 2-3 sentences.]"
            imagePlaceholder="👤"
          />
          <TeamMember
            name="[Team Member Name]"
            role="[Role Title]"
            bio="[Brief bio: background, gifting, why they serve at Ruach. 2-3 sentences.]"
            imagePlaceholder="👤"
          />
          <TeamMember
            name="[Team Member Name]"
            role="[Role Title]"
            bio="[Brief bio: background, gifting, why they serve at Ruach. 2-3 sentences.]"
            imagePlaceholder="👤"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Board of Directors</h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          Our board provides spiritual oversight, financial accountability, and strategic guidance. They meet quarterly to review ministry direction, approve budgets, and ensure Ruach remains faithful to its calling.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <BoardMember
            name="[Board Member Name]"
            title="Board Chair"
            description="[Brief description of their background, expertise, and role on the board. 1-2 sentences.]"
          />
          <BoardMember
            name="[Board Member Name]"
            title="Board Secretary"
            description="[Brief description of their background, expertise, and role on the board. 1-2 sentences.]"
          />
          <BoardMember
            name="[Board Member Name]"
            title="Board Treasurer"
            description="[Brief description of their background, expertise, and role on the board. 1-2 sentences.]"
          />
          <BoardMember
            name="[Board Member Name]"
            title="Board Member"
            description="[Brief description of their background, expertise, and role on the board. 1-2 sentences.]"
          />
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Support Team & Volunteers</h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          Behind every testimony, course, and outreach event is a team of faithful servants—some paid staff, many unpaid volunteers—who give their time, skills, and hearts to see the Kingdom advance.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Media Production</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Filming, editing, and publishing testimonies and teaching content that equips believers worldwide.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Outreach Coordination</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Organizing weekly outreaches, managing volunteers, and mobilizing teams to bring the Gospel to the streets.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Prayer & Intercession</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Covering the ministry, events, and partners in prayer. The unseen labor that fuels everything we do.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Technology & Platform</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Building and maintaining the digital tools that deliver content, process giving, and connect the community.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Partner Care</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Stewarding relationships with donors, responding to inquiries, and honoring those who fuel the mission.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Administration</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Legal compliance, bookkeeping, scheduling, and all the behind-the-scenes work that keeps the ministry running.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Want to Join the Team?</h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          We're always looking for faithful servants who are gifted, humble, and committed to the mission. If you sense God calling you to serve with Ruach—whether as a volunteer or in a paid role—reach out.
        </p>
        <div className="mt-6 space-y-3 text-sm text-zinc-700 dark:text-white/80">
          <p>
            <strong className="text-zinc-900 dark:text-white">Current Openings:</strong> Check our <a href="mailto:hello@joinruach.org?subject=Job Inquiry" className="underline">email</a> or social channels for active roles.
          </p>
          <p>
            <strong className="text-zinc-900 dark:text-white">Volunteer Opportunities:</strong> Join a weekly outreach team, help with media production, or serve in prayer ministry.
          </p>
          <p>
            <strong className="text-zinc-900 dark:text-white">Internships:</strong> We occasionally offer short-term ministry internships for those exploring a call to vocational ministry.
          </p>
        </div>
        <div className="mt-6">
          <a
            href="mailto:hello@joinruach.org?subject=Interested in Serving"
            className="inline-block rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            Email Us About Serving
          </a>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-zinc-900 shadow-sm dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Every member matters. Every role is ministry.
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          Whether you're filming a testimony, praying in the background, or managing finances—your labor in the Lord is not in vain. Thank you for being part of what God is doing through Ruach.
        </p>
      </section>
    </div>
  );
}
