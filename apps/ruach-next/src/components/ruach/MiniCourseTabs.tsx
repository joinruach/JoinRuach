"use client";

import { useMemo, useState } from "react";
import type { PlayerConfig } from "@/lib/types/strapi-types";

type MiniCourseTabsProps = {
  lessonTitle: string;
  lessonSummary?: string;
  playerConfig?: PlayerConfig;
};

type TabId = "read" | "listen" | "do";

const TAB_ORDER: Array<{ id: TabId; label: string; description: string }> = [
  { id: "read", label: "Read", description: "Swipe cards" },
  { id: "listen", label: "Listen", description: "Audio-first" },
  { id: "do", label: "Do", description: "Assignments" },
];

export default function MiniCourseTabs({ playerConfig, lessonTitle, lessonSummary }: MiniCourseTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("read");
  const microDrills = playerConfig?.microDrillPrompts ?? [
    "Name the cost of compromise in one sentence.",
    "What do you fear losing?",
    "What would obedience cost today?",
  ];

  const readCards = useMemo(
    () => [
      {
        title: "Scripture",
        body:
          lessonSummary ??
          `${lessonTitle} anchors us in the Word before we unravel every allegiance.`,
      },
      {
        title: "Lie exposed",
        body: "Identify the small, smooth lie that keeps the pattern alive.",
      },
      {
        title: "Question",
        body: "What is the obedience step God is already asking for in this moment?",
      },
      {
        title: "Action",
        body: "Capture one concrete step—do it within five minutes.",
      },
      {
        title: "Prayer",
        body: "Declare truth and ask the Spirit to replace the lie.",
      },
    ],
    [lessonTitle, lessonSummary]
  );

  return (
    <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white/90 p-5 text-neutral-900">
      <div className="flex flex-wrap gap-2">
        {TAB_ORDER.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`rounded-full px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] transition ${
              activeTab === tab.id
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 text-neutral-500 hover:border-amber-300 hover:text-neutral-900"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="text-xs uppercase tracking-[0.3em] text-neutral-500">
        {TAB_ORDER.find((tab) => tab.id === activeTab)?.description}
      </div>
      {activeTab === "read" ? (
        <div className="space-y-3">
          {readCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-600">{card.title}</p>
              <p className="mt-2 text-sm text-neutral-800">{card.body}</p>
            </div>
          ))}
        </div>
      ) : activeTab === "listen" ? (
        <div className="rounded-2xl border border-neutral-200 bg-black/90 p-4 text-sm text-white">
          <p className="text-sm font-semibold text-white">Audio-first mode</p>
          <p className="mt-2 text-xs text-white/70">
            Tap play, lock your screen, and keep the message running. The lesson continues exactly where you left off.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Micro-drills (30 seconds)</p>
          <div className="space-y-2">
            {microDrills.map((prompt, index) => (
              <div key={index} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-800">
                {prompt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
