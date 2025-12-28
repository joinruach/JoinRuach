/**
 * Formation Debug Page
 * Shows current formation state projected from events
 */

import { getCurrentFormationState } from "@/lib/formation/state";

export default async function FormationDebugPage() {
  const state = await getCurrentFormationState();

  if (!state) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Formation State</h1>
        <p className="text-gray-600">No formation journey started yet.</p>
        <a href="/guidebook/enter" className="text-blue-600 hover:underline mt-4 block">
          → Start your formation journey
        </a>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Formation State (Projected from Events)</h1>

      <div className="space-y-6">
        {/* Current Phase */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Current Phase</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Phase</div>
              <div className="text-lg font-medium capitalize">{state.currentPhase}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Days in Phase</div>
              <div className="text-lg font-medium">{state.daysInPhase}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Phase Entered At</div>
              <div className="text-lg font-medium">
                {state.phaseEnteredAt.toLocaleDateString()}
              </div>
            </div>
          </div>
        </section>

        {/* Progress */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Progress</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Sections Viewed</div>
              <div className="text-2xl font-bold">{state.sectionsViewed.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Checkpoints Reached</div>
              <div className="text-2xl font-bold">{state.checkpointsReached.length}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Reflections Submitted</div>
              <div className="text-2xl font-bold">{state.reflectionsSubmitted}</div>
            </div>
          </div>
        </section>

        {/* Checkpoints */}
        {state.checkpointsReached.length > 0 && (
          <section className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Checkpoints</h2>
            <div className="space-y-2">
              {state.checkpointsReached.map((checkpointId) => (
                <div key={checkpointId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <span className="font-medium">{checkpointId}</span>
                  {state.checkpointsCompleted.includes(checkpointId) ? (
                    <span className="text-green-600 font-semibold">✓ Completed</span>
                  ) : (
                    <span className="text-yellow-600">Reached</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Activity */}
        <section className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Activity</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Last Activity</div>
              <div className="text-lg font-medium">
                {state.lastActivityAt.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Journey Started</div>
              <div className="text-lg font-medium">
                {state.createdAt.toLocaleString()}
              </div>
            </div>
          </div>
        </section>

        {/* Raw State (Debug) */}
        <details className="bg-gray-50 p-6 rounded-lg">
          <summary className="cursor-pointer font-semibold text-gray-700">
            View Raw State (Debug)
          </summary>
          <pre className="mt-4 p-4 bg-gray-900 text-gray-100 rounded overflow-x-auto text-sm">
            {JSON.stringify(state, null, 2)}
          </pre>
        </details>
      </div>

      <div className="mt-8 flex gap-4">
        <a
          href="/guidebook/awakening"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Continue Formation →
        </a>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
        >
          Refresh State
        </button>
      </div>
    </div>
  );
}
