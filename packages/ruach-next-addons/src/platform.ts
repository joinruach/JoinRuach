/**
 * Platform detection and utilities
 */

export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function isServer(): boolean {
  return typeof window === 'undefined';
}

export function getUserAgent(): string {
  if (!isBrowser()) return '';
  return navigator.userAgent;
}

export function isMobile(): boolean {
  if (!isBrowser()) return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(getUserAgent());
}

export function isIOS(): boolean {
  if (!isBrowser()) return false;
  return /iPad|iPhone|iPod/.test(getUserAgent());
}

export function isAndroid(): boolean {
  if (!isBrowser()) return false;
  return /Android/.test(getUserAgent());
}

export function isSafari(): boolean {
  if (!isBrowser()) return false;
  return /^((?!chrome|android).)*safari/i.test(getUserAgent());
}

export function isChrome(): boolean {
  if (!isBrowser()) return false;
  return /Chrome/.test(getUserAgent()) && /Google Inc/.test(navigator.vendor);
}

export function isFirefox(): boolean {
  if (!isBrowser()) return false;
  return /Firefox/.test(getUserAgent());
}

export function supportsWebP(): boolean {
  if (!isBrowser()) return false;
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
}

export function supportsTouchEvents(): boolean {
  if (!isBrowser()) return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (!isBrowser()) return 'desktop';
  const ua = getUserAgent();
  if (/Tablet|iPad/i.test(ua)) return 'tablet';
  if (/Mobile|Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return 'mobile';
  return 'desktop';
}
