import Bubble from '../entities/Bubble';
import paletteJson from '../data/palette.json';
import BackgroundRenderer from '../renderers/BackgroundRenderer';

const COLORS = paletteJson.colors;
const randColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

export default function makePlay(ctx: CanvasRenderingContext2D) {
  const bubbles: Bubble[] = [];
  let spawn = 0;
  const bg = new BackgroundRenderer();

  return {
    update(dt: number) {
      spawn -= dt;
      if (spawn <= 0) {
        bubbles.push(new Bubble(Math.random(), randColor()));
        spawn = 1.2;
      }

      bg.update(dt);
      bg.draw(ctx);

      bubbles.forEach(b => b.draw(ctx, dt));
    }
  };
}
