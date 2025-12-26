"use client";

import { useState } from "react";
import LocalizedLink from "@/components/navigation/LocalizedLink";

// Note: Metadata export moved to layout.tsx or separate metadata file
// Client components cannot export metadata in Next.js

interface FAQItemProps {
  question: string;
  answer: string | React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}

function FAQItem({ question, answer, isOpen, onClick }: FAQItemProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-white/5">
      <button
        onClick={onClick}
        className="flex w-full items-start justify-between gap-4 p-6 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-white/5"
      >
        <span className="font-semibold text-zinc-900 dark:text-white">{question}</span>
        <span className="flex-shrink-0 text-2xl text-amber-600 dark:text-amber-400">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen ? (
        <div className="border-t border-zinc-200 px-6 py-4 text-sm text-zinc-700 dark:border-white/10 dark:text-white/80">
          {typeof answer === "string" ? <p>{answer}</p> : answer}
        </div>
      ) : null}
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      category: "About Ruach",
      questions: [
        {
          question: "What is Ruach Ministries?",
          answer: (
            <>
              <p>
                Ruach is a prophetic media ministry that forms, equips, and sends believers to carry freedom and establish Kingdom communities. The name "Ruach" means <em>breath</em> in Hebrew—representing the Spirit of God moving through story, truth, and mission.
              </p>
              <p className="mt-3">
                We tell testimonies, disciple believers in the Word and the gifts of the Spirit, and mobilize outreach teams—so what God does in private lives is carried into public places.
              </p>
            </>
          ),
        },
        {
          question: "What does Ruach believe theologically?",
          answer: (
            <>
              <p>
                We hold to historic Christian orthodoxy while emphasizing the gifts of the Holy Spirit, deliverance ministry, and prophetic witness. We believe in the authority of Scripture, salvation by grace through faith in Jesus Christ alone, and the active work of the Holy Spirit today.
              </p>
              <p className="mt-3">
                For a full statement of faith, visit our{" "}
                <a href="/beliefs" className="underline text-amber-700 dark:text-amber-300">What We Believe</a> page.
              </p>
            </>
          ),
        },
        {
          question: "Is Ruach a church or a ministry organization?",
          answer:
            "Ruach is a 501(c)(3) nonprofit ministry organization—not a local church. We exist to serve the global Church by producing media, equipping disciples, and mobilizing outreach. We encourage everyone to be planted in a local church while engaging with Ruach's resources and events.",
        },
        {
          question: "Who leads Ruach Ministries?",
          answer: (
            <>
              <p>
                Ruach is led by a team of servants committed to biblical stewardship, accountability, and Spirit-led ministry. We operate under a board of directors who provide spiritual oversight and financial governance.
              </p>
              <p className="mt-3">
                Learn more about our team on the{" "}
                <a href="/team" className="underline text-amber-700 dark:text-amber-300">Leadership & Team</a> page.
              </p>
            </>
          ),
        },
      ],
    },
    {
      category: "Getting Started",
      questions: [
        {
          question: "I'm new to Ruach. Where should I start?",
          answer: (
            <>
              <p>
                Start with our{" "}
                <a href="/start" className="underline text-amber-700 dark:text-amber-300">Start Here</a> page, which explains who Ruach is for, how most people move through the ministry, and what your next step could be.
              </p>
              <p className="mt-3">
                From there, you can:
              </p>
              <ul className="mt-2 space-y-1 pl-4">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 dark:text-amber-300">•</span>
                  <span>Watch a <a href="/media" className="underline">testimony</a> to see real stories of freedom</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 dark:text-amber-300">•</span>
                  <span>Take a <a href="/courses" className="underline">course</a> to grow in biblical knowledge and spiritual gifts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 dark:text-amber-300">•</span>
                  <span>Join <a href="/community-outreach" className="underline">community outreach</a> to serve alongside us</span>
                </li>
              </ul>
            </>
          ),
        },
        {
          question: "Do I need to create an account?",
          answer:
            "You can browse most content without an account. However, creating a free account allows you to save your course progress, track what you've watched, and receive personalized content recommendations. Accounts are optional but helpful for those who want to engage deeply with Ruach's resources.",
        },
        {
          question: "How much does it cost?",
          answer:
            "All of Ruach's media, courses, and resources are free. We are supported by generous partners who believe in this mission. If you've been blessed by Ruach and want to fuel the work, you can give on our Give page—but it's never required to access content.",
        },
      ],
    },
    {
      category: "Media & Content",
      questions: [
        {
          question: "What kind of content does Ruach produce?",
          answer:
            "We produce testimonies of deliverance and healing, biblical teaching courses, prophetic media, conference recordings, and resources for spiritual warfare and discipleship. Everything we create is designed to equip believers for freedom, formation, and mission.",
        },
        {
          question: "Can I share Ruach content with others?",
          answer:
            "Yes! We encourage you to share testimonies, courses, and media with friends, family, and your church. Use the share buttons on each media page or send direct links. All content is free to access and share for personal, non-commercial use.",
        },
        {
          question: "Can I download videos or audio for offline use?",
          answer:
            "Members with accounts may have access to downloadable content for offline viewing. Check individual media pages for download options. If you need content for offline use (e.g., missions trip, low-connectivity area), contact us—we're happy to help.",
        },
        {
          question: "How do I submit a testimony?",
          answer: (
            <>
              <p>
                If you have a story of deliverance, healing, or transformation that would strengthen the Church, we'd love to hear it. Visit our{" "}
                <a href="/contact" className="underline text-amber-700 dark:text-amber-300">Contact page</a> and reach out to our Stories team.
              </p>
              <p className="mt-3">
                We review every submission prayerfully and will follow up to discuss next steps if we believe it should be featured publicly.
              </p>
            </>
          ),
        },
      ],
    },
    {
      category: "Courses & Discipleship",
      questions: [
        {
          question: "Are the courses live or on-demand?",
          answer:
            "Most courses are on-demand, meaning you can start anytime and work through lessons at your own pace. Occasionally we host live cohorts or intensives—those will be announced on the Events page and via our newsletter.",
        },
        {
          question: "Do I get a certificate when I complete a course?",
          answer:
            "Currently, Ruach does not issue formal certificates or accreditation. Our courses are designed for personal formation, not academic credit. However, completing a course equips you with biblical knowledge, practical tools, and spiritual insight that will serve you for a lifetime.",
        },
        {
          question: "Can I use Ruach courses with my church or small group?",
          answer:
            "Absolutely! Ruach courses are designed to work well in group settings. You can watch lessons together and discuss the content. If you're a pastor or small group leader, reach out—we're happy to provide guidance on how to facilitate Ruach content in your community.",
        },
      ],
    },
    {
      category: "Outreach & Involvement",
      questions: [
        {
          question: "What happens at a Ruach community outreach?",
          answer:
            "Our weekly outreaches typically include street evangelism, prayer ministry, grocery distribution, and testimonies. We gather beforehand to pray, then head out to parks, neighborhoods, or public spaces to share the Gospel, serve practical needs, and pray for people. It's not a performance—it's real ministry, led by the Spirit.",
        },
        {
          question: "Do I need experience to join an outreach?",
          answer:
            "No experience required! We train and equip volunteers before each outreach. If you're a believer with a willing heart, you're qualified. We'll walk you through how to share your testimony, pray for others, and minister with confidence and humility.",
        },
        {
          question: "How can I volunteer with Ruach?",
          answer: (
            <>
              <p>
                We need faithful servants in media production, outreach coordination, prayer ministry, technology, partner care, and administration. If you sense God calling you to serve, reach out via our{" "}
                <a href="/contact" className="underline text-amber-700 dark:text-amber-300">Contact page</a> or email{" "}
                <a href="mailto:hello@joinruach.org" className="underline">hello@joinruach.org</a>.
              </p>
            </>
          ),
        },
        {
          question: "Can Ruach come to my church or event?",
          answer: (
            <>
              <p>
                We'd love to serve your church, conference, or outreach! Email our Events team at{" "}
                <a href="mailto:events@joinruach.org" className="underline">events@joinruach.org</a> with details about your event, location, and what you're hoping for. We'll get back to you with availability and next steps.
              </p>
            </>
          ),
        },
      ],
    },
    {
      category: "Giving & Partnership",
      questions: [
        {
          question: "How are donations used?",
          answer: (
            <>
              <p>
                Every dollar you give fuels media production, discipleship resources, community outreach, and operational costs that sustain long-term ministry effectiveness. We publish an annual financial report and maintain transparency around how funds are allocated.
              </p>
              <p className="mt-3">
                Learn more on our{" "}
                <a href="/transparency" className="underline text-amber-700 dark:text-amber-300">Financial Transparency</a> page.
              </p>
            </>
          ),
        },
        {
          question: "Is my donation tax-deductible?",
          answer:
            "Yes. Ruach Ministries is a 501(c)(3) nonprofit organization. All donations are tax-deductible to the fullest extent allowed by law. You will receive a receipt for your records after each gift.",
        },
        {
          question: "Can I give to a specific project?",
          answer:
            "In most cases, gifts go toward general ministry operations unless you designate otherwise. If you want to support a specific initiative (e.g., a conference, outreach trip, or media project), include that in the donation notes or email our Partners team at partners@joinruach.org.",
        },
        {
          question: "What does it mean to be a monthly partner?",
          answer:
            "Monthly partners commit to giving a recurring gift each month. This provides sustainable support that allows us to plan long-term, hire staff, and invest in projects that require consistent funding. Monthly partners also receive exclusive updates, early access to new content, and prayer covering from our team.",
        },
      ],
    },
    {
      category: "Privacy & Security",
      questions: [
        {
          question: "How does Ruach handle my personal information?",
          answer: (
            <>
              <p>
                We take your privacy seriously. We collect only what's necessary to serve you (email, name, payment details), and we never sell or share your data with third parties for marketing purposes.
              </p>
              <p className="mt-3">
                Read our full{" "}
                <a href="/privacy" className="underline text-amber-700 dark:text-amber-300">Privacy Policy</a> for details.
              </p>
            </>
          ),
        },
        {
          question: "Can I unsubscribe from emails?",
          answer:
            "Yes. Every email we send includes an unsubscribe link. Clicking it will immediately remove you from our list. No questions asked. We respect your inbox and will only send you 1–2 emails per month with ministry updates, new content, and events.",
        },
        {
          question: "Is my payment information secure?",
          answer:
            "Absolutely. We use Stripe and Givebutter—industry-standard, PCI-compliant payment processors—to handle all donations. We do not store full credit card numbers on our servers. All transactions are encrypted and secure.",
        },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">
          Frequently Asked Questions
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">
          Questions? We've Got Answers.
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-700 dark:text-white/80">
          If you don't find what you're looking for below, reach out—we're here to help. Email{" "}
          <a href="mailto:hello@joinruach.org" className="underline">hello@joinruach.org</a> with your question and we'll get back to you within a few days.
        </p>
      </section>

      {faqs.map((section, sectionIndex) => (
        <section key={section.category}>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
              {section.category}
            </h2>
          </div>
          <div className="space-y-3">
            {section.questions.map((faq, questionIndex) => {
              const globalIndex = sectionIndex * 100 + questionIndex;
              return (
                <FAQItem
                  key={globalIndex}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === globalIndex}
                  onClick={() => setOpenIndex(openIndex === globalIndex ? null : globalIndex)}
                />
              );
            })}
          </div>
        </section>
      ))}

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-zinc-900 shadow-sm dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Still have questions?
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          We're here to serve you. Whether it's about theology, technology, or how to get involved—send us a message and we'll respond with clarity and care.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <a
            href="mailto:hello@joinruach.org"
            className="inline-block rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Email Our Team
          </a>
          <LocalizedLink href="/contact">
            <span className="inline-block rounded-full border border-amber-700 px-6 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-300 dark:text-amber-100 dark:hover:bg-amber-500/20">
              Visit Contact Page
            </span>
          </LocalizedLink>
        </div>
      </section>
    </div>
  );
}
