import {
  BUBBLE_ALPHA,
  FONT_FAMILY,
  FONT_COLOUR,
  KANA_FONT_RATIO,
  ROMAJI_FONT_RATIO,
  BUBBLE_FLASH_ALPHA,
  BUBBLE_STROKE_WIDTH,
} from '../config/constants';

import type Bubble from '@/entities/Bubble';

export default class BubbleRenderer {
  // Helper function to create a pastel darkened version of a color
  private pastelDarken(color: string, amount: number): string {
    // Extract RGB components
    const rgb = this.extractRGB(color);

    // Darken while maintaining pastel quality by moving toward a soft purple/pink
    // rather than just darkening directly
    const r = Math.floor(rgb.r * (1 - amount * 0.7) + 30);
    const g = Math.floor(rgb.g * (1 - amount) + 20);
    const b = Math.floor(rgb.b * (1 - amount * 0.5) + 40); // Keep blues stronger for pastel feel

    return `rgb(${Math.min(r, 255)}, ${Math.min(g, 255)}, ${Math.min(b, 255)})`;
  }

  // Helper function to create a pastel lightened version of a color
  private pastelLighten(color: string, amount: number): string {
    // Extract RGB components
    const rgb = this.extractRGB(color);

    // Lighten while maintaining pastel quality by adding soft white
    const r = Math.floor(rgb.r + (255 - rgb.r) * amount);
    const g = Math.floor(rgb.g + (255 - rgb.g) * amount);
    const b = Math.floor(rgb.b + (255 - rgb.b) * amount);

    return `rgb(${r}, ${g}, ${b})`;
  }

  // Helper function to extract RGB values from different color formats
  private extractRGB(color: string): { r: number; g: number; b: number } {
    let r = 100,
      g = 100,
      b = 100;

    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    // Handle rgb colors
    else if (color.startsWith('rgb')) {
      const match = color.match(/\d+/g);
      if (match && match.length >= 3) {
        r = parseInt(match[0] || '0');
        g = parseInt(match[1] || '0');
        b = parseInt(match[2] || '0');
      }
    }

    return { r, g, b };
  }
  /**
   * We still accept parallax parameter for API consistency, but bubbles now stay in place
   * while the background moves for the parallax effect.
   */
  render(
    ctx: CanvasRenderingContext2D,
    b: Bubble,
    w: number,
    h: number,
    _waste?: unknown, // Unused but kept for API consistency
  ): void {
    // No parallax shifting applied to bubbles - they stay in place
    const pxX = b.x * w;
    const pxY = b.y * h;
    // Use the unified scale for a uniform bubble squish animation
    const radius = b.r * b.scale; // scaled radius

    // Enhanced 3D bubble with gradient
    ctx.save();
    ctx.globalAlpha = BUBBLE_ALPHA;

    // Create radial gradient for 3D effect
    const gradientX = pxX - radius * 0.3;
    const gradientY = pxY - radius * 0.3;
    // Ensure all parameters are numbers (not undefined)
    const gradient = ctx.createRadialGradient(
      Number(gradientX) || 0,
      Number(gradientY) || 0,
      Math.max(1, radius * 0.1), // Inner circle (highlight)
      Number(pxX) || 0,
      Number(pxY) || 0,
      Math.max(1, radius * 1.2), // Outer circle (extends slightly beyond bubble)
    );

    // Extract base color components for gradient
    const baseColor = b.color || '#cccccc'; // Fallback color if undefined

    // Add gradient stops for pastel cutesy 3D effect
    gradient.addColorStop(0, '#ffffff'); // Bright highlight
    gradient.addColorStop(0.1, this.pastelLighten(baseColor, 0.4)); // Pastel lighter shade
    gradient.addColorStop(0.7, baseColor); // Main color
    const edge = this.pastelDarken(baseColor, 0.15); // Subtle darker edge
    gradient.addColorStop(0.92, edge); // Actual ring
    gradient.addColorStop(1.0, 'rgba(0,0,0,0)'); // Transparent feathered edge

    // Apply gradient
    ctx.fillStyle = gradient;

    // Draw circle with the scaled radius
    ctx.beginPath();
    ctx.arc(pxX, pxY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Add cute inner glow for depth instead of shadow
    ctx.beginPath();
    ctx.arc(pxX, pxY, radius * 0.96, 0, Math.PI * 2);
    ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
    ctx.shadowBlur = radius * 0.15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fill();

    // Add two white reflection circles for a cutesy look
    // Main highlight
    ctx.beginPath();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.arc(pxX - radius * 0.43, pxY - radius * 0.49, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Secondary smaller highlight (adds character)
    ctx.beginPath();
    ctx.globalAlpha = 0.25;
    ctx.arc(pxX - radius * 0.1, pxY - radius * 0.66, radius * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    /* ---- kana/romaji text with fade transition ---- */
    const label = b.showingRomaji ? b.romaji : b.glyph;
    const ratio = b.showingRomaji ? ROMAJI_FONT_RATIO : KANA_FONT_RATIO;

    // Use the text-specific scale factor
    const labelSize = Math.round(b.r * b.currentTextScale * ratio);

    // Apply text opacity for fade effect
    ctx.save();
    ctx.fillStyle = FONT_COLOUR;
    ctx.globalAlpha = b.currentTextOpacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${labelSize}px ${FONT_FAMILY}`;
    ctx.fillText(label, pxX, pxY);
    ctx.restore();

    /* ---- white rim flash ---- */
    if (b.flashAlpha > 0) {
      ctx.save();
      ctx.globalAlpha = b.flashAlpha * BUBBLE_FLASH_ALPHA;
      ctx.lineWidth = BUBBLE_STROKE_WIDTH;
      ctx.strokeStyle = '#ffffff';

      // Add pastel glow effect to the stroke
      ctx.shadowColor = 'rgba(255, 235, 245, 0.9)';
      ctx.shadowBlur = BUBBLE_STROKE_WIDTH * 2.5;

      // Draw circular stroke with the scaled radius
      ctx.beginPath();
      ctx.arc(pxX, pxY, radius + BUBBLE_STROKE_WIDTH * 0.5, 0, Math.PI * 2);

      ctx.stroke();
      ctx.restore();
    }
  }
}
