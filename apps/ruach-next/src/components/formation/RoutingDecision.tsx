"use client";

import Link from "next/link";

export type RoutingType = "publish" | "journal" | "thread" | "review";
type RoutingColor = "green" | "blue" | "yellow" | "red";

export interface RoutingDecisionProps {
  depthScore: number;
  routingType: RoutingType;
  reflectionId: string;
  checkpointId: string;
  sectionId: string;
  phase: string;
}

interface RoutingConfig {
  type: RoutingType;
  title: string;
  description: string;
  color: RoutingColor;
  icon: string;
  actions: Array<{
    label: string;
    href: string;
    primary?: boolean;
  }>;
  guidance: string;
}

export function RoutingDecision({
  depthScore,
  routingType,
  reflectionId,
  checkpointId,
  sectionId,
  phase,
}: RoutingDecisionProps) {
  const ROUTING_CONFIG: Record<RoutingType, RoutingConfig> = {
    publish: {
      type: "publish",
      title: "Ready to Publish",
      description:
        "Your reflection demonstrates deep spiritual insight and is ready to be shared publicly with the community.",
      color: "green",
      icon: "🌟",
      actions: [
        {
          label: "Publish to Community",
          href: "/formation/publish",
          primary: true,
        },
        { label: "Save to Journal First", href: "/formation/journal" },
        { label: "Continue Reading", href: "/guidebook" },
      ],
      guidance:
        "Your honesty, specificity, and alignment with Scripture demonstrate mature spiritual reflection. Consider sharing this to help others grow in their own formation journey.",
    },
    journal: {
      type: "journal",
      title: "Save to Private Journal",
      description:
        "Your reflection shows good engagement and is ready to be saved privately for your own spiritual journey.",
      color: "blue",
      icon: "📖",
      actions: [
        {
          label: "Save to Journal",
          href: "/formation/journal",
          primary: true,
        },
        { label: "Publish to Community", href: "/formation/publish" },
        { label: "Continue Reading", href: "/guidebook" },
      ],
      guidance:
        "This reflection captures your growth. Consider returning to it later to see how your understanding develops over time.",
    },
    thread: {
      type: "thread",
      title: "Continue with Prompts",
      description:
        "Your reflection has started well. Let's dive deeper with additional prompts to develop fuller understanding.",
      color: "yellow",
      icon: "💭",
      actions: [
        {
          label: "Continue with Sharpening Prompts",
          href: "/formation/thread",
          primary: true,
        },
        { label: "Save and Revisit Later", href: "/guidebook" },
      ],
      guidance:
        "Don't worry - you're on the right track! These additional prompts are designed to help you explore the topic more deeply and make more specific connections.",
    },
    review: {
      type: "review",
      title: "Revisit Your Response",
      description:
        "Let's take another look at your reflection. There's potential here to go deeper.",
      color: "red",
      icon: "🔄",
      actions: [
        {
          label: "Revise Reflection",
          href: `/guidebook/${phase}/${checkpointId}`,
          primary: true,
        },
        { label: "Get Writing Tips", href: "/formation/tips" },
        { label: "Back to Checkpoint", href: "/guidebook" },
      ],
      guidance:
        "Reflection is a skill that grows with practice. Consider: Are you being specific about your own experience? Are you wrestling with the material rather than just summarizing?",
    },
  };

  const config = ROUTING_CONFIG[routingType];
  const colorClasses = {
    green: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
    blue: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    yellow:
      "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800",
    red: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800",
  };

  const textColors = {
    green: "text-green-900 dark:text-green-100",
    blue: "text-blue-900 dark:text-blue-100",
    yellow: "text-yellow-900 dark:text-yellow-100",
    red: "text-red-900 dark:text-red-100",
  };

  const headingColors = {
    green: "text-green-900 dark:text-green-100",
    blue: "text-blue-900 dark:text-blue-100",
    yellow: "text-yellow-900 dark:text-yellow-100",
    red: "text-red-900 dark:text-red-100",
  };

  const buttonColors = {
    green:
      "bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white",
    yellow:
      "bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white",
    red: "bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white",
  };

  const secondaryButtonColors = {
    green:
      "text-green-600 dark:text-green-400 border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-950/20",
    blue: "text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20",
    yellow:
      "text-yellow-600 dark:text-yellow-400 border-yellow-300 dark:border-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950/20",
    red: "text-red-600 dark:text-red-400 border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-950/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`rounded-2xl border-2 ${colorClasses[config.color]} p-8`}
      >
        <div className="flex items-center gap-4 mb-4">
          <span className="text-4xl">{config.icon}</span>
          <div>
            <h2
              className={`text-3xl font-bold ${headingColors[config.color]} mb-2`}
            >
              {config.title}
            </h2>
            <p className={`text-base ${textColors[config.color]}`}>
              {config.description}
            </p>
          </div>
        </div>

        {/* Score Info */}
        <div className="mt-6 pt-6 border-t border-current border-opacity-20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-75">Depth Score</p>
              <p className={`text-3xl font-bold ${headingColors[config.color]}`}>
                {Math.round(depthScore * 100)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75">Reflection ID</p>
              <p className="text-xs font-mono opacity-50 break-words max-w-xs">
                {reflectionId.substring(0, 16)}...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Guidance */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
        <h3 className="font-bold text-gray-900 dark:text-white mb-3">
          What This Means
        </h3>
        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          {config.guidance}
        </p>
      </div>

      {/* Metadata */}
      <div className="grid md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Routing Type
          </p>
          <p className="font-mono text-gray-900 dark:text-white capitalize">
            {config.type}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Checkpoint
          </p>
          <p className="font-mono text-gray-900 dark:text-white truncate">
            {checkpointId}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-900 dark:text-white">
          What's Next?
        </h3>
        <div className="space-y-2">
          {config.actions.map((action, idx) => {
            const isPrimary = action.primary ?? false;
            return (
              <Link
                key={idx}
                href={action.href}
                className={`block w-full rounded-lg px-6 py-3 font-medium text-center transition-colors border ${
                  isPrimary
                    ? `${buttonColors[config.color]} border-transparent`
                    : `${secondaryButtonColors[config.color]} border`
                }`}
              >
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Help */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Questions?</span> Remember, the goal
          of formation is growth, not judgment. These routing suggestions are
          meant to help you continue deepening your relationship with God and
          others.
        </p>
      </div>
    </div>
  );
}
