"use client";

import { useState, useRef, useEffect } from "react";

export interface VoiceRecorderProps {
  onTranscriptionStart?: () => void;
  onTranscriptionComplete?: (text: string) => void;
  onTranscriptionError?: (error: string) => void;
  disabled?: boolean;
}

type RecordingState = "idle" | "recording" | "paused" | "processing";

export function VoiceRecorder({
  onTranscriptionStart,
  onTranscriptionComplete,
  onTranscriptionError,
  disabled = false,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      mediaRecorder.start();
      setState("recording");
      startTimeRef.current = Date.now();

      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to access microphone. Please check permissions.";
      setError(message);
      onTranscriptionError?.(message);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.pause();
      setState("paused");
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && state === "paused") {
      mediaRecorderRef.current.resume();
      setState("recording");
      startTimeRef.current = Date.now() - duration * 1000;

      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.addEventListener("stop", async () => {
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
          }

          const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

          if (audioBlob.size === 0) {
            setError("No audio recorded. Please try again.");
            onTranscriptionError?.("No audio recorded");
            setState("idle");
            resolve();
            return;
          }

          setState("processing");
          onTranscriptionStart?.();

          try {
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            const response = await fetch("/api/transcribe", {
              method: "POST",
              body: formData,
            });

            if (!response.ok) {
              const error = await response.text();
              throw new Error(error || "Transcription failed");
            }

            const result = (await response.json()) as { text: string };
            onTranscriptionComplete?.(result.text);
            setState("idle");
            setDuration(0);
          } catch (err) {
            const message =
              err instanceof Error
                ? err.message
                : "Transcription failed. Please try again.";
            setError(message);
            onTranscriptionError?.(message);
            setState("idle");
          }

          resolve();
        });

        mediaRecorderRef.current.stop();
        streamRef.current?.getTracks().forEach((track) => track.stop());
      }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {state === "idle" ? (
          <button
            onClick={startRecording}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            <span>🎙️</span>
            Start Recording
          </button>
        ) : state === "recording" ? (
          <>
            <button
              onClick={pauseRecording}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
            >
              <span>⏸</span>
              Pause
            </button>
            <button
              onClick={() => stopRecording()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              <span>⏹</span>
              Stop
            </button>
          </>
        ) : state === "paused" ? (
          <>
            <button
              onClick={resumeRecording}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
            >
              <span>▶️</span>
              Resume
            </button>
            <button
              onClick={() => stopRecording()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              <span>⏹</span>
              Stop
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg">
            <span>⏳</span>
            Processing...
          </div>
        )}

        {(state === "recording" || state === "paused") && (
          <div className="flex items-center gap-3 ml-4">
            {state === "recording" && (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Recording
                </span>
              </span>
            )}
            <span className="font-mono text-lg font-semibold text-gray-900 dark:text-white">
              {formatTime(duration)}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-600 dark:text-red-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <p className="text-xs text-gray-600 dark:text-gray-400">
        Tip: Click "Start Recording" to capture your voice reflection. You can pause, resume, and stop recording at any time. Your audio will be transcribed automatically.
      </p>
    </div>
  );
}
