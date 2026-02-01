/**
 * Formation Reflection Routing Feedback
 * Displays AI analysis results and routing decision after checkpoint submission
 */

"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RoutingDecision } from "@/components/formation/RoutingDecision";
import { AIAnalysisDisplay } from "@/components/formation/AIAnalysisDisplay";
import { decodeRoutingData } from "@/lib/formation/routing";
import type { RoutingData } from "@/lib/formation/routing";

export default function RoutingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<RoutingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!searchParams) {
      setIsLoading(false);
      return;
    }
    // Parse routing data from URL parameters
    try {
      const paramsData = searchParams.get("data");
      if (paramsData) {
        const routingData = decodeRoutingData(paramsData);
        if (routingData) {
          setData(routingData);
        } else {
          throw new Error("Failed to decode routing data");
        }
      }
    } catch (error) {
      console.error("Failed to parse routing data:", error);
      // Redirect back if data is invalid
      router.push("/guidebook/awakening");
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center">
            <div className="inline-block">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse" />
            </div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading your results...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Unable to Load Results
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We couldn't load your routing feedback. This might happen if you
              navigated here directly.
            </p>
            <button
              onClick={() => router.push("/guidebook/awakening")}
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Return to Guidebook
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900 dark:to-black">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Header */}
        <header className="mb-12">
          <div className="mb-4 text-sm font-medium uppercase tracking-wide text-blue-700 dark:text-blue-400">
            Formation Feedback
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl">
            Your Reflection Analysis
          </h1>
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            Here's what the AI found in your reflection and what we recommend
            next.
          </p>
        </header>

        {/* AI Analysis Results */}
        <section className="mb-12">
          <AIAnalysisDisplay
            scores={data.scores}
            sharpeningQuestions={data.sharpeningQuestions}
            summary={data.summary}
          />
        </section>

        {/* Routing Decision */}
        <section className="mb-12">
          <RoutingDecision
            depthScore={data.depthScore}
            routingType={data.routing}
            reflectionId={data.reflectionId}
            checkpointId={data.checkpointId}
            sectionId={data.sectionId}
            phase={data.phase}
          />
        </section>

        {/* Guidance Footer */}
        <footer className="text-center pt-12 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Remember:</span> Formation is about
            growth, not judgment. These insights are meant to deepen your
            spiritual practice and understanding over time.
          </p>
        </footer>
      </div>
    </div>
  );
}
