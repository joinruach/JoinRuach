'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

export default function WaveformComparison({
  masterAudioUrl,
  comparisonAudioUrl,
  offsetMs,
  masterLabel = 'Master',
  comparisonLabel = 'Comparison',
}: {
  masterAudioUrl: string;
  comparisonAudioUrl: string;
  offsetMs: number;
  masterLabel?: string;
  comparisonLabel?: string;
}) {
  const masterWaveformRef = useRef<HTMLDivElement>(null);
  const comparisonWaveformRef = useRef<HTMLDivElement>(null);
  const masterWavesurfer = useRef<WaveSurfer | null>(null);
  const comparisonWavesurfer = useRef<WaveSurfer | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [bothLoaded, setBothLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    if (!masterWaveformRef.current || !comparisonWaveformRef.current) return;

    let masterLoaded = false;
    let comparisonLoaded = false;

    try {
      // Initialize master waveform
      masterWavesurfer.current = WaveSurfer.create({
        container: masterWaveformRef.current,
        waveColor: 'rgb(212, 181, 138)', // ruachGold
        progressColor: 'rgb(160, 133, 96)', // darker ruachGold
        height: 80,
        normalize: true,
        backend: 'WebAudio',
        barWidth: 2,
        barGap: 1,
      });

      masterWavesurfer.current.on('ready', () => {
        masterLoaded = true;
        if (comparisonLoaded) setBothLoaded(true);
      });

      masterWavesurfer.current.on('error', (error) => {
        console.error('Master waveform error:', error);
        setLoadingError(`Failed to load master audio: ${error}`);
      });

      masterWavesurfer.current.load(masterAudioUrl);

      // Initialize comparison waveform with offset visualization
      comparisonWavesurfer.current = WaveSurfer.create({
        container: comparisonWaveformRef.current,
        waveColor: 'rgb(96, 165, 250)', // blue-400
        progressColor: 'rgb(59, 130, 246)', // blue-500
        height: 80,
        normalize: true,
        backend: 'WebAudio',
        barWidth: 2,
        barGap: 1,
      });

      comparisonWavesurfer.current.on('ready', () => {
        comparisonLoaded = true;
        if (masterLoaded) setBothLoaded(true);
      });

      comparisonWavesurfer.current.on('error', (error) => {
        console.error('Comparison waveform error:', error);
        setLoadingError(`Failed to load comparison audio: ${error}`);
      });

      comparisonWavesurfer.current.load(comparisonAudioUrl);

      // Unified playback controller (prevents drift)
      function syncPlayback() {
        if (!masterWavesurfer.current || !comparisonWavesurfer.current) return;

        const masterTime = masterWavesurfer.current.getCurrentTime();
        const comparisonTime = comparisonWavesurfer.current.getCurrentTime();
        const offsetSeconds = offsetMs / 1000;
        const expectedComparisonTime = masterTime + offsetSeconds;

        // If drift > 50ms, resync
        if (Math.abs(comparisonTime - expectedComparisonTime) > 0.05) {
          const comparisonDuration =
            comparisonWavesurfer.current.getDuration();
          const clampedTime = Math.max(
            0,
            Math.min(expectedComparisonTime, comparisonDuration)
          );
          comparisonWavesurfer.current.seekTo(
            clampedTime / comparisonDuration
          );
        }
      }

      // Sync every 100ms during playback
      const handlePlay = () => {
        setIsPlaying(true);
        comparisonWavesurfer.current?.play();
        syncTimerRef.current = window.setInterval(syncPlayback, 100);
      };

      const handlePause = () => {
        setIsPlaying(false);
        comparisonWavesurfer.current?.pause();
        if (syncTimerRef.current) {
          clearInterval(syncTimerRef.current);
          syncTimerRef.current = null;
        }
      };

      masterWavesurfer.current.on('play', handlePlay);
      masterWavesurfer.current.on('pause', handlePause);

      // Apply offset on seek (with clamping)
      const handleInteraction = () => {
        if (!masterWavesurfer.current || !comparisonWavesurfer.current) return;

        const masterTime = masterWavesurfer.current.getCurrentTime();
        const offsetSeconds = offsetMs / 1000;
        const comparisonDuration = comparisonWavesurfer.current.getDuration();
        const targetTime = masterTime + offsetSeconds;

        // Clamp to valid range
        const clampedTime = Math.max(
          0,
          Math.min(targetTime, comparisonDuration)
        );
        comparisonWavesurfer.current.seekTo(clampedTime / comparisonDuration);
      };

      masterWavesurfer.current.on('interaction', handleInteraction);
    } catch (error) {
      console.error('Error initializing wavesurfers:', error);
      setLoadingError(
        `Initialization error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      masterWavesurfer.current?.destroy();
      comparisonWavesurfer.current?.destroy();
    };
  }, [masterAudioUrl, comparisonAudioUrl, offsetMs]);

  if (loadingError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-sm text-red-800 dark:text-red-200">
          {loadingError}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          {masterLabel}
        </label>
        <div
          ref={masterWaveformRef}
          className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
          {comparisonLabel} ({offsetMs > 0 ? '+' : ''}
          {offsetMs}ms offset)
        </label>
        <div
          ref={comparisonWaveformRef}
          className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => masterWavesurfer.current?.playPause()}
          disabled={!bothLoaded}
          className="px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {!bothLoaded
            ? 'Loading waveforms...'
            : 'Click waveform to scrub • Both tracks play in sync'}
        </span>
      </div>
    </div>
  );
}
