import { Metadata } from 'next';
import { RenderPipelineUI } from '@/components/studio/RenderPipeline';

export const metadata: Metadata = {
  title: 'Render Pipeline | Ruach Studio',
  description: 'Create and monitor video renders from your recording sessions',
};

/**
 * Phase 13: Render Pipeline Studio Page
 *
 * Fully integrated render pipeline UI for creating and monitoring
 * video renders from multi-camera recording sessions.
 */
export default function RenderPipelinePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <RenderPipelineUI />
    </div>
  );
}
