// Runtime helpers kept out of the constants layer.
export function bubbleRadius(cssWidth: number, cssHeight: number): number {
  return Math.min(cssWidth, cssHeight) * 0.06;
}
