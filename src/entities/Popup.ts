// src/entities/Popup.ts

export default class Popup {
  public ttl: number = 1; // seconds

  constructor(
    public x: number,
    public y: number,
    public text: string,
  ) {}

  step(dt: number): void {
    this.ttl -= dt;
    this.y -= dt * 0.2; // Move upwards
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.ttl <= 0) return;

    ctx.save(); // Save context state
    ctx.globalAlpha = Math.max(0, this.ttl); // Apply fade effect
    ctx.fillStyle = '#222';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    const dpr = window.devicePixelRatio || 1;
    ctx.fillText(this.text, this.x * dpr, this.y * dpr);
    ctx.restore(); // Restore context state (mainly globalAlpha)
  }
}
