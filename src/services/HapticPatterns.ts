// Central catalogue of vibration recipes (pure data)
const HAPTIC_PATTERNS = {
  pop: 50, // short single tap
  error: [50, 100, 50], // double buzz
  success: [50, 50, 50, 50, 100], // short fanfare
  gameOver: [100, 50, 100, 50, 300],
} as const;

export type HapticPatternName = keyof typeof HAPTIC_PATTERNS;
export default HAPTIC_PATTERNS;
