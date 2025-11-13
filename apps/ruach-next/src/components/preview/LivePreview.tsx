/**
 * Live Preview Component
 * Handles communication between Strapi admin panel and Next.js frontend
 * for the Live Preview feature (Strapi Growth/Enterprise plans)
 *
 * This component should be added to your root layout to enable:
 * - Real-time content updates in the preview iframe
 * - Interactive editing by double-clicking content
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Strapi Live Preview message types
type StrapiUpdateMessage = {
  type: 'strapiUpdate';
};

type StrapiScriptMessage = {
  type: 'strapiScript';
  payload: {
    script: string;
  };
};

type StrapiPreviewMessage = StrapiUpdateMessage | StrapiScriptMessage;

export default function LivePreview() {
  const router = useRouter();

  useEffect(() => {
    /**
     * Handle messages from Strapi admin panel
     */
    const handleMessage = async (message: MessageEvent<StrapiPreviewMessage>) => {
      const { origin, data } = message;

      // Verify message is from Strapi admin panel
      const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';
      const strapiOrigin = new URL(strapiUrl).origin;

      if (origin !== strapiOrigin) {
        return;
      }

      // Handle different message types
      if (data.type === 'strapiUpdate') {
        // Content has been updated in Strapi - refresh the preview
        // router.refresh() re-fetches server components without a full page reload
        router.refresh();
      } else if (data.type === 'strapiScript') {
        // Strapi is sending the Live Preview script
        // This script enables interactive editing and content highlighting
        const script = window.document.createElement('script');
        script.textContent = data.payload.script;
        window.document.head.appendChild(script);
      }
    };

    // Add the event listener
    window.addEventListener('message', handleMessage);

    // Let Strapi know we're ready to receive the Live Preview script
    window.parent?.postMessage({ type: 'previewReady' }, '*');

    // Cleanup: remove the event listener on unmount
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [router]);

  // This component doesn't render anything visible
  return null;
}
