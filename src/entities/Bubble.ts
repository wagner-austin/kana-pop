export default class Bubble {
  constructor(public x: number, public color: string) {}
  draw(ctx: CanvasRenderingContext2D, _dt: number) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x * ctx.canvas.width, ctx.canvas.height - 40, 20, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.globalAlpha = 0.5;
    ctx.fill();
    ctx.restore();
  }
}
