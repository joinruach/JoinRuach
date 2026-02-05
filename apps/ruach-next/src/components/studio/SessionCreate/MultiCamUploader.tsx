'use client';

import { useState } from 'react';
import { usePresignedUpload } from '@/hooks/usePresignedUpload';
import type { CameraAngle } from '@/lib/studio';

interface CameraUploadState {
  file: File | null;
  assetId: string | null;
  progress: number;
  status: 'idle' | 'uploading' | 'complete' | 'error';
  error: string | null;
}

export default function MultiCamUploader({
  authToken,
  assetIds,
  onUpdate,
  onNext,
  onBack,
}: {
  authToken: string;
  assetIds: { A?: string; B?: string; C?: string };
  onUpdate: (assetIds: { A?: string; B?: string; C?: string }) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const cameras: CameraAngle[] = ['A', 'B', 'C'];

  const [cameraStates, setCameraStates] = useState<
    Record<CameraAngle, CameraUploadState>
  >({
    A: {
      file: null,
      assetId: assetIds.A || null,
      progress: 0,
      status: assetIds.A ? 'complete' : 'idle',
      error: null,
    },
    B: {
      file: null,
      assetId: assetIds.B || null,
      progress: 0,
      status: assetIds.B ? 'complete' : 'idle',
      error: null,
    },
    C: {
      file: null,
      assetId: assetIds.C || null,
      progress: 0,
      status: assetIds.C ? 'complete' : 'idle',
      error: null,
    },
  });

  // Update camera state
  const updateCameraState = (
    camera: CameraAngle,
    updates: Partial<CameraUploadState>
  ) => {
    setCameraStates((prev) => ({
      ...prev,
      [camera]: { ...prev[camera], ...updates },
    }));
  };

  // Handle file selection
  const handleFileSelect = async (camera: CameraAngle, file: File) => {
    updateCameraState(camera, { file, status: 'idle', error: null });
  };

  // Upload a single camera
  const uploadCamera = async (camera: CameraAngle) => {
    const state = cameraStates[camera];
    if (!state.file) return;

    updateCameraState(camera, { status: 'uploading', error: null });

    try {
      // Upload to R2
      const upload = usePresignedUpload();
      const result = await upload.upload({
        file: state.file,
        onProgress: (progress) => {
          updateCameraState(camera, { progress });
        },
      });

      // Create asset in Strapi
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/recording-assets`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: {
              angle: camera,
              filename: state.file.name,
              r2_key: result.key,
              uploadStatus: 'complete',
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create asset record');
      }

      const data = await response.json();
      const assetId = data.data?.id || data.data?.documentId;

      updateCameraState(camera, {
        assetId: String(assetId),
        status: 'complete',
        progress: 100,
      });

      // Update parent component
      onUpdate({
        ...assetIds,
        [camera]: String(assetId),
      });
    } catch (error) {
      updateCameraState(camera, {
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  };

  const allCamerasComplete =
    cameraStates.A.status === 'complete' &&
    cameraStates.B.status === 'complete' &&
    cameraStates.C.status === 'complete';

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Tip:</strong> Upload all 3 camera angles. AI will automatically
          sync them based on audio.
        </p>
      </div>

      {/* Camera Upload Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <CameraUploadCard
            key={camera}
            camera={camera}
            state={cameraStates[camera]}
            onFileSelect={(file) => handleFileSelect(camera, file)}
            onUpload={() => uploadCamera(camera)}
          />
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!allCamerasComplete}
          className="px-6 py-3 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Create →
        </button>
      </div>
    </div>
  );
}

// ==========================================
// Camera Upload Card
// ==========================================

function CameraUploadCard({
  camera,
  state,
  onFileSelect,
  onUpload,
}: {
  camera: CameraAngle;
  state: CameraUploadState;
  onFileSelect: (file: File) => void;
  onUpload: () => void;
}) {
  const cameraLabels: Record<CameraAngle, string> = {
    A: 'Wide Shot',
    B: 'Medium Shot',
    C: 'Close Shot',
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Camera {camera}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {cameraLabels[camera]}
        </span>
      </div>

      {/* File input */}
      {state.status === 'idle' && !state.file && (
        <div>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-ruachGold file:text-ruachDark
              hover:file:bg-opacity-90
              file:cursor-pointer"
          />
        </div>
      )}

      {/* Selected file */}
      {state.file && state.status === 'idle' && (
        <div className="space-y-3">
          <div className="text-sm text-gray-700 dark:text-gray-300 truncate">
            {state.file.name}
          </div>
          <button
            onClick={onUpload}
            className="w-full px-4 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 transition-colors font-medium"
          >
            Upload
          </button>
        </div>
      )}

      {/* Upload progress */}
      {state.status === 'uploading' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 dark:text-gray-300">
              Uploading...
            </span>
            <span className="text-gray-500">{state.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-ruachGold h-2 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload complete */}
      {state.status === 'complete' && (
        <div className="flex items-center text-green-600 dark:text-green-400 text-sm">
          <svg
            className="w-5 h-5 mr-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Upload complete
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <div className="space-y-2">
          <div className="text-red-500 text-sm">{state.error}</div>
          <button
            onClick={() => state.file && onUpload()}
            className="text-sm text-ruachGold hover:underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
