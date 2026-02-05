'use client';

export default function ManualOffsetAdjuster({
  cameras,
  offsets,
  onUpdate,
}: {
  cameras: readonly string[];
  offsets: Record<string, number>;
  onUpdate: (offsets: Record<string, number>) => void;
}) {
  const handleOffsetChange = (camera: string, delta: number) => {
    const currentOffset = offsets[camera] || 0;
    onUpdate({
      ...offsets,
      [camera]: currentOffset + delta,
    });
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4">
        Manual Offset Adjustment
      </h3>
      <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-6">
        Low confidence detected. Use the controls below to fine-tune sync
        offsets manually.
      </p>

      <div className="space-y-6">
        {cameras.map((camera) => (
          <div key={camera} className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Camera {camera} Offset
              </label>
              <span className="text-lg font-mono font-semibold text-gray-900 dark:text-white">
                {offsets[camera] > 0 ? '+' : ''}
                {offsets[camera] || 0}ms
              </span>
            </div>

            {/* Nudge buttons */}
            <div className="grid grid-cols-6 gap-2">
              <button
                onClick={() => handleOffsetChange(camera, -1000)}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                -1s
              </button>
              <button
                onClick={() => handleOffsetChange(camera, -500)}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                -500ms
              </button>
              <button
                onClick={() => handleOffsetChange(camera, -100)}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                -100ms
              </button>
              <button
                onClick={() => handleOffsetChange(camera, 100)}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                +100ms
              </button>
              <button
                onClick={() => handleOffsetChange(camera, 500)}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                +500ms
              </button>
              <button
                onClick={() => handleOffsetChange(camera, 1000)}
                className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                +1s
              </button>
            </div>

            {/* Slider for fine control */}
            <input
              type="range"
              min={-5000}
              max={5000}
              step={10}
              value={offsets[camera] || 0}
              onChange={(e) =>
                onUpdate({
                  ...offsets,
                  [camera]: Number(e.target.value),
                })
              }
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-ruachGold"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>-5000ms</span>
              <span>0ms</span>
              <span>+5000ms</span>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-xs text-yellow-700 dark:text-yellow-300">
        <strong>Tip:</strong> Use the waveform comparison above to verify your
        adjustments visually.
      </p>
    </div>
  );
}
