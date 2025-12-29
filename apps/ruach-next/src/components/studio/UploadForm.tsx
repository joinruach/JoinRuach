'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/ruach/FileUpload';
import { StepIndicator, StepNavigation, StepContainer } from './FormSteps';
import type { UploadResult } from '@/hooks/usePresignedUpload';
import type { MediaUploadFormData } from '@/lib/upload-schema';
import { validatePlatformTitle } from '@/lib/upload-schema';

interface UploadFormProps {
  speakers: Array<{ id: number; attributes: { name?: string; displayName?: string } }>;
  categories: Array<{ id: number; attributes: { name?: string; slug?: string } }>;
  series: Array<{ id: number; attributes: { title?: string; slug?: string } }>;
  onSubmit: (data: MediaUploadFormData) => Promise<void>;
}

const STEPS = [
  { label: 'Upload', icon: '📤' },
  { label: 'Details', icon: '✏️' },
  { label: 'Media', icon: '🎬' },
  { label: 'Publishing', icon: '🚀' },
  { label: 'Review', icon: '👁️' },
];

export default function UploadForm({ speakers, categories, series, onSubmit }: UploadFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<MediaUploadFormData>>({
    contentType: 'teaching',
    speakers: [],
    tags: [],
    categories: [],
    publishYouTube: false,
    publishFacebook: false,
    publishInstagram: false,
    publishX: false,
    publishPatreon: false,
    publishRumble: false,
    publishLocals: false,
    publishTruthSocial: false,
    autoPublish: false,
  });

  const updateFormData = (data: Partial<MediaUploadFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const goToNextStep = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData as MediaUploadFormData);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return Boolean(formData.videoUrl && formData.sourceKey);
      case 2:
        return Boolean(formData.title && formData.contentType);
      case 3:
      case 4:
        return true; // Optional steps
      case 5:
        return Boolean(formData.title && formData.videoUrl);
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <StepIndicator currentStep={currentStep} totalSteps={STEPS.length} steps={STEPS} />

      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow">
        {currentStep === 1 && (
          <Step1FileUpload formData={formData} updateFormData={updateFormData} />
        )}

        {currentStep === 2 && (
          <Step2BasicMetadata formData={formData} updateFormData={updateFormData} />
        )}

        {currentStep === 3 && (
          <Step3MediaDetails
            formData={formData}
            updateFormData={updateFormData}
            speakers={speakers}
            categories={categories}
            series={series}
          />
        )}

        {currentStep === 4 && (
          <Step4PublishingSettings formData={formData} updateFormData={updateFormData} />
        )}

        {currentStep === 5 && <Step5Review formData={formData} />}

        <StepNavigation
          currentStep={currentStep}
          totalSteps={STEPS.length}
          onBack={goToPrevStep}
          onNext={goToNextStep}
          onSubmit={handleSubmit}
          isNextDisabled={!isStepValid()}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}

// Step 1: File Upload
function Step1FileUpload({
  formData,
  updateFormData,
}: {
  formData: Partial<MediaUploadFormData>;
  updateFormData: (data: Partial<MediaUploadFormData>) => void;
}) {
  const handleUploadComplete = (result: UploadResult) => {
    updateFormData({
      videoUrl: result.publicUrl,
      sourceKey: result.key,
    });
  };

  return (
    <StepContainer
      title="Upload Media File"
      description="Upload your video, audio, or media file (up to 4GB)"
    >
      <FileUpload
        accept={['video/*', 'audio/*']}
        maxSize={4 * 1024 * 1024 * 1024}
        onUploadComplete={handleUploadComplete}
        label="Upload Media"
      />

      {formData.videoUrl && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            ✓ File uploaded successfully!
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1 break-all">
            {formData.videoUrl}
          </p>
        </div>
      )}
    </StepContainer>
  );
}

// Step 2: Basic Metadata
function Step2BasicMetadata({
  formData,
  updateFormData,
}: {
  formData: Partial<MediaUploadFormData>;
  updateFormData: (data: Partial<MediaUploadFormData>) => void;
}) {
  const selectedPlatforms = Object.entries(formData)
    .filter(([key, value]) => key.startsWith('publish') && key !== 'publishNow' && value === true)
    .map(([key]) => key.replace('publish', '').toLowerCase());

  const titleValidation = formData.title
    ? validatePlatformTitle(formData.title, selectedPlatforms)
    : { valid: true, errors: [] };

  return (
    <StepContainer
      title="Basic Information"
      description="Provide title, description, and content type"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Title *
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => updateFormData({ title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold dark:bg-gray-700 dark:text-white"
            placeholder="Enter media title"
            maxLength={255}
            required
          />
          {!titleValidation.valid && (
            <div className="mt-1 text-xs text-red-600">
              {titleValidation.errors.map((err, i) => (
                <div key={i}>⚠️ {err}</div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Content Type *
          </label>
          <select
            value={formData.contentType || 'teaching'}
            onChange={(e) =>
              updateFormData({
                contentType: e.target.value as MediaUploadFormData['contentType'],
              })
            }
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold dark:bg-gray-700 dark:text-white"
            required
          >
            <option value="teaching">Teaching</option>
            <option value="testimony">Testimony</option>
            <option value="worship">Worship</option>
            <option value="podcast">Podcast</option>
            <option value="short">Short</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Excerpt (Optional)
          </label>
          <input
            type="text"
            value={formData.excerpt || ''}
            onChange={(e) => updateFormData({ excerpt: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold dark:bg-gray-700 dark:text-white"
            placeholder="Short summary"
            maxLength={500}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description (Optional)
          </label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateFormData({ description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold dark:bg-gray-700 dark:text-white"
            rows={4}
            placeholder="Full description"
          />
        </div>
      </div>
    </StepContainer>
  );
}

// Step 3: Media Details (continued in next message due to length)
function Step3MediaDetails({
  formData,
  updateFormData,
  speakers,
  categories,
  series,
}: {
  formData: Partial<MediaUploadFormData>;
  updateFormData: (data: Partial<MediaUploadFormData>) => void;
  speakers: UploadFormProps['speakers'];
  categories: UploadFormProps['categories'];
  series: UploadFormProps['series'];
}) {
  const toggleSpeaker = (id: number) => {
    const current = formData.speakers || [];
    const updated = current.includes(id)
      ? current.filter((s) => s !== id)
      : [...current, id];
    updateFormData({ speakers: updated });
  };

  const toggleCategory = (id: number) => {
    const current = formData.categories || [];
    const updated = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    updateFormData({ categories: updated });
  };

  return (
    <StepContainer
      title="Media Details"
      description="Add speakers, categories, and series information"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Speakers
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
            {speakers.map((speaker) => (
              <label key={speaker.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData.speakers || []).includes(speaker.id)}
                  onChange={() => toggleSpeaker(speaker.id)}
                  className="rounded text-ruachGold focus:ring-ruachGold"
                />
                <span className="text-sm">
                  {speaker.attributes.displayName || speaker.attributes.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Categories
          </label>
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(formData.categories || []).includes(category.id)}
                  onChange={() => toggleCategory(category.id)}
                  className="rounded text-ruachGold focus:ring-ruachGold"
                />
                <span className="text-sm">{category.attributes.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Series (Optional)
          </label>
          <select
            value={formData.series || ''}
            onChange={(e) => updateFormData({ series: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold dark:bg-gray-700 dark:text-white"
          >
            <option value="">No series</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.attributes.title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Week Number
            </label>
            <input
              type="number"
              value={formData.weekNumber || ''}
              onChange={(e) =>
                updateFormData({ weekNumber: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold dark:bg-gray-700 dark:text-white"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Episode Number
            </label>
            <input
              type="number"
              value={formData.episodeNumber || ''}
              onChange={(e) =>
                updateFormData({ episodeNumber: e.target.value ? Number(e.target.value) : undefined })
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-ruachGold dark:bg-gray-700 dark:text-white"
              min="1"
            />
          </div>
        </div>
      </div>
    </StepContainer>
  );
}

// Step 4: Publishing Settings
function Step4PublishingSettings({
  formData,
  updateFormData,
}: {
  formData: Partial<MediaUploadFormData>;
  updateFormData: (data: Partial<MediaUploadFormData>) => void;
}) {
  const platforms = [
    { key: 'publishYouTube', label: 'YouTube', icon: '📺' },
    { key: 'publishFacebook', label: 'Facebook', icon: '👥' },
    { key: 'publishInstagram', label: 'Instagram', icon: '📷' },
    { key: 'publishX', label: 'X (Twitter)', icon: '🐦' },
    { key: 'publishPatreon', label: 'Patreon', icon: '💰' },
    { key: 'publishRumble', label: 'Rumble', icon: '🎬' },
    { key: 'publishLocals', label: 'Locals', icon: '🏘️' },
    { key: 'publishTruthSocial', label: 'Truth Social', icon: '🗽' },
  ] as const;

  return (
    <StepContainer
      title="Publishing Settings"
      description="Choose which platforms to publish to"
    >
      <div className="space-y-4">
        <div>
          <label className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="checkbox"
              checked={formData.autoPublish || false}
              onChange={(e) => updateFormData({ autoPublish: e.target.checked })}
              className="rounded text-ruachGold focus:ring-ruachGold"
            />
            <div>
              <div className="font-medium">Auto-Publish</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Automatically publish to selected platforms upon creation
              </div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {platforms.map(({ key, label, icon }) => (
            <label
              key={key}
              className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <input
                type="checkbox"
                checked={(formData[key] as boolean) || false}
                onChange={(e) => updateFormData({ [key]: e.target.checked })}
                className="rounded text-ruachGold focus:ring-ruachGold"
              />
              <span className="text-xl">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </StepContainer>
  );
}

// Step 5: Review
function Step5Review({ formData }: { formData: Partial<MediaUploadFormData> }) {
  const selectedPlatforms = Object.entries(formData)
    .filter(([key, value]) => key.startsWith('publish') && key !== 'publishNow' && key !== 'autoPublish' && value === true)
    .map(([key]) => key.replace('publish', ''));

  return (
    <StepContainer title="Review & Confirm" description="Review your media item before creating">
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Basic Info</h3>
          <dl className="space-y-1 text-sm">
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Title:</dt>
              <dd className="font-medium">{formData.title}</dd>
            </div>
            <div>
              <dt className="text-gray-600 dark:text-gray-400">Type:</dt>
              <dd className="font-medium capitalize">{formData.contentType}</dd>
            </div>
            {formData.excerpt && (
              <div>
                <dt className="text-gray-600 dark:text-gray-400">Excerpt:</dt>
                <dd className="font-medium">{formData.excerpt}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-medium text-gray-900 dark:text-white mb-2">Publishing</h3>
          <p className="text-sm">
            <span className="text-gray-600 dark:text-gray-400">Platforms: </span>
            {selectedPlatforms.length > 0 ? selectedPlatforms.join(', ') : 'None selected'}
          </p>
          <p className="text-sm mt-1">
            <span className="text-gray-600 dark:text-gray-400">Auto-publish: </span>
            {formData.autoPublish ? 'Yes' : 'No'}
          </p>
        </div>
      </div>
    </StepContainer>
  );
}
