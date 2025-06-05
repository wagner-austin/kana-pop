/**
 * Device and browser detection utilities
 *
 * These functions are designed to be pure and lazy-evaluated,
 * only accessing browser APIs when called and with appropriate guards.
 * This makes them suitable for server-side rendering and unit testing.
 */

/**
 * Check if the current device is running iOS
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream: unknown }).MSStream;
}

/**
 * Check if the current device is an iPad or iPad-like device
 * Modern iPads report as 'MacIntel' platform with touch points
 */
export function isIPadOS(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  return /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Check if the current browser is Safari (not including Chrome)
 */
export function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome/.test(ua);
}

/**
 * Check if the current device requires special audio handling
 * This includes iOS and iPadOS devices which have strict audio policies
 */
export function requiresSpecialAudioHandling(): boolean {
  return isIOS() || isIPadOS();
}
