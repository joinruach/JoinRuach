/**
 * Analytics utilities for tracking events
 */

interface TrackEventOptions {
  props?: Record<string, string | number | boolean>;
  revenue?: { currency: string; amount: number };
}

/**
 * Track custom event with Plausible Analytics
 * @param eventName - Name of the event
 * @param options - Event properties and revenue
 */
export function trackEvent(eventName: string, options?: TrackEventOptions): void {
  if (typeof window === 'undefined') return;

  const plausible = (window as any).plausible;
  if (!plausible) {
    console.warn('Plausible analytics not loaded');
    return;
  }

  plausible(eventName, options);
}

/**
 * Track page view (automatic with Plausible, but can be called manually for SPAs)
 * @param url - URL of the page
 */
export function trackPageView(url?: string): void {
  if (typeof window === 'undefined') return;

  const plausible = (window as any).plausible;
  if (!plausible) return;

  plausible('pageview', { u: url || window.location.href });
}

/**
 * Track outbound link click
 * @param url - External URL
 * @param props - Additional properties
 */
export function trackOutboundLink(url: string, props?: Record<string, string | number | boolean>): void {
  trackEvent('Outbound Link: Click', {
    props: {
      url,
      ...props,
    },
  });
}

/**
 * Track file download
 * @param filename - Downloaded file name
 * @param fileType - File type/extension
 */
export function trackDownload(filename: string, fileType?: string): void {
  trackEvent('File Downloaded', {
    props: {
      filename,
      fileType: fileType || filename.split('.').pop() || 'unknown',
    },
  });
}

/**
 * Track video play
 * @param videoTitle - Video title
 * @param videoId - Video ID
 */
export function trackVideoPlay(videoTitle: string, videoId: string): void {
  trackEvent('Video Play', {
    props: {
      title: videoTitle,
      id: videoId,
    },
  });
}

/**
 * Track search query
 * @param query - Search query
 * @param results - Number of results
 */
export function trackSearch(query: string, results?: number): void {
  trackEvent('Search', {
    props: {
      query,
      ...(results !== undefined && { results }),
    },
  });
}

/**
 * Track form submission
 * @param formName - Name of the form
 * @param success - Whether submission succeeded
 */
export function trackFormSubmit(formName: string, success: boolean = true): void {
  trackEvent('Form Submit', {
    props: {
      form: formName,
      success: success ? 'true' : 'false',
    },
  });
}

/**
 * Track donation/conversion
 * @param amount - Donation amount
 * @param currency - Currency code
 * @param type - One-time or recurring
 */
export function trackDonation(amount: number, currency: string = 'USD', type: 'one-time' | 'recurring' = 'one-time'): void {
  trackEvent('Donation', {
    props: {
      type,
      currency,
    },
    revenue: {
      currency,
      amount,
    },
  });
}
