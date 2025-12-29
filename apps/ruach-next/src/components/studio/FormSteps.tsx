'use client';

import { ReactNode } from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  steps: Array<{ label: string; icon: string }>;
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <div key={stepNumber} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${isActive ? 'bg-ruachGold text-ruachDark' : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? '✓' : step.icon}
                </div>
                <div
                  className={`
                    mt-2 text-xs font-medium text-center
                    ${isActive ? 'text-ruachGold' : ''}
                    ${isCompleted ? 'text-green-600' : ''}
                    ${!isActive && !isCompleted ? 'text-gray-500' : ''}
                  `}
                >
                  {step.label}
                </div>
              </div>

              {/* Connector Line (except for last step) */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-0.5 mx-2
                    ${isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  isNextDisabled?: boolean;
  isSubmitting?: boolean;
  nextLabel?: string;
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  onSubmit,
  isNextDisabled = false,
  isSubmitting = false,
  nextLabel,
}: StepNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  const handleNext = () => {
    if (isLastStep && onSubmit) {
      onSubmit();
    } else {
      onNext();
    }
  };

  return (
    <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
      {/* Back Button */}
      {!isFirstStep && (
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Back
        </button>
      )}

      {/* Spacer if first step */}
      {isFirstStep && <div />}

      {/* Next/Submit Button */}
      <button
        type="button"
        onClick={handleNext}
        disabled={isNextDisabled || isSubmitting}
        className="px-6 py-2 bg-ruachGold text-ruachDark rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            {isLastStep ? 'Creating...' : 'Processing...'}
          </span>
        ) : (
          nextLabel || (isLastStep ? 'Create Media Item' : 'Next →')
        )}
      </button>
    </div>
  );
}

interface StepContainerProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function StepContainer({ title, description, children }: StepContainerProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
