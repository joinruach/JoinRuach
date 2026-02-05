'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SessionMetadataForm from './SessionMetadataForm';
import MultiCamUploader from './MultiCamUploader';
import IngestionTrigger from './IngestionTrigger';
import type { CameraAngle } from '@/lib/studio';

export interface SessionFormData {
  // Step 1: Metadata
  title: string;
  recordingDate: Date;
  description?: string;
  speakers?: string[]; // Author IDs
  eventType?: 'service' | 'teaching' | 'podcast' | 'other';
  anchorAngle: CameraAngle;

  // Step 2: Assets
  assetIds: {
    A?: string;
    B?: string;
    C?: string;
  };
}

type WizardStep = 1 | 2 | 3;

export default function SessionCreateWizard({
  authToken,
  locale,
}: {
  authToken: string;
  locale: string;
}) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<Partial<SessionFormData>>({
    anchorAngle: 'A', // Default master camera
    eventType: 'service',
    assetIds: {},
  });

  // Update form data (partial merge)
  const updateFormData = (updates: Partial<SessionFormData>) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
    }));
  };

  // Navigate between steps
  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  // Handle session creation (Step 3)
  const handleComplete = (sessionId: number) => {
    router.push(`/${locale}/studio/sessions/${sessionId}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
      {/* Step Indicator */}
      <div className="bg-gray-50 dark:bg-gray-900 px-8 py-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <StepIndicator
            step={1}
            label="Session Info"
            active={currentStep === 1}
            completed={currentStep > 1}
            onClick={() => goToStep(1)}
          />
          <StepConnector active={currentStep > 1} />
          <StepIndicator
            step={2}
            label="Upload Cameras"
            active={currentStep === 2}
            completed={currentStep > 2}
            onClick={() => currentStep > 1 && goToStep(2)}
            disabled={currentStep < 2}
          />
          <StepConnector active={currentStep > 2} />
          <StepIndicator
            step={3}
            label="Create Session"
            active={currentStep === 3}
            completed={false}
            disabled={currentStep < 3}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="p-8">
        {currentStep === 1 && (
          <SessionMetadataForm
            data={formData}
            onUpdate={updateFormData}
            onNext={nextStep}
          />
        )}

        {currentStep === 2 && (
          <MultiCamUploader
            authToken={authToken}
            assetIds={formData.assetIds || {}}
            onUpdate={(assetIds) => updateFormData({ assetIds })}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}

        {currentStep === 3 && (
          <IngestionTrigger
            authToken={authToken}
            formData={formData as SessionFormData}
            onBack={prevStep}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}

// ==========================================
// Step Indicator Components
// ==========================================

function StepIndicator({
  step,
  label,
  active,
  completed,
  disabled,
  onClick,
}: {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const canClick = !disabled && (completed || active);

  return (
    <button
      onClick={canClick ? onClick : undefined}
      disabled={!canClick}
      className={`flex flex-col items-center ${
        canClick ? 'cursor-pointer' : 'cursor-default'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
          active
            ? 'bg-ruachGold text-ruachDark'
            : completed
            ? 'bg-green-500 text-white'
            : disabled
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        }`}
      >
        {completed ? '✓' : step}
      </div>
      <span
        className={`mt-2 text-sm font-medium ${
          active
            ? 'text-ruachGold'
            : completed
            ? 'text-green-600 dark:text-green-400'
            : disabled
            ? 'text-gray-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function StepConnector({ active }: { active: boolean }) {
  return (
    <div className="flex-1 mx-4 h-0.5 bg-gray-200 dark:bg-gray-700 relative">
      <div
        className={`absolute inset-0 transition-all duration-300 ${
          active ? 'bg-green-500 w-full' : 'bg-gray-200 dark:bg-gray-700 w-0'
        }`}
      />
    </div>
  );
}
