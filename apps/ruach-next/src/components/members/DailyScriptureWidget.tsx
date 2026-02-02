"use client";

import { useEffect, useState } from "react";
import LocalizedLink from "@/components/navigation/LocalizedLink";

// Curated verses for daily rotation
const VERSES = [
  {
    reference: "John 3:8",
    text: "The wind blows where it wishes, and you hear its sound, but you do not know where it comes from or where it goes. So it is with everyone who is born of the Spirit.",
  },
  {
    reference: "Romans 8:14",
    text: "For all who are led by the Spirit of God are sons of God.",
  },
  {
    reference: "Acts 1:8",
    text: "But you will receive power when the Holy Spirit has come upon you, and you will be my witnesses in Jerusalem and in all Judea and Samaria, and to the end of the earth.",
  },
  {
    reference: "Galatians 5:25",
    text: "If we live by the Spirit, let us also keep in step with the Spirit.",
  },
  {
    reference: "Ezekiel 37:14",
    text: "And I will put my Spirit within you, and you shall live, and I will place you in your own land. Then you shall know that I am the LORD; I have spoken, and I will do it, declares the LORD.",
  },
  {
    reference: "Joel 2:28",
    text: "And it shall come to pass afterward, that I will pour out my Spirit on all flesh; your sons and your daughters shall prophesy, your old men shall dream dreams, and your young men shall see visions.",
  },
];

export default function DailyScriptureWidget() {
  const [verse, setVerse] = useState(VERSES[0]);

  useEffect(() => {
    // Rotate based on day of year for consistent daily verse
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % VERSES.length;
    setVerse(VERSES[index]);
  }, []);

  return (
    <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/10 dark:to-white/5 p-6 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
        Daily Scripture
      </h3>
      <blockquote className="mt-4 space-y-4">
        <p className="text-sm leading-relaxed text-zinc-700 dark:text-white/80">
          "{verse.text}"
        </p>
        <cite className="not-italic text-xs font-semibold text-amber-600 dark:text-amber-400">
          — {verse.reference}
        </cite>
      </blockquote>
      <LocalizedLink href="/scripture">
        <span className="mt-4 inline-flex items-center text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
          Explore Scripture →
        </span>
      </LocalizedLink>
    </section>
  );
}
