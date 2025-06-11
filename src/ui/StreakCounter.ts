/** Simple DOM overlay to display the current streak count.
 *  Appears as a pill at top-right with a small fire emoji.
 */
export default class StreakCounter {
  private el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.style.cssText = `
      position:fixed;top:12px;right:12px;z-index:40;
      padding:8px 18px;border-radius:28px;
      background:rgba(0,0,0,.7);color:#fff;
      font:700 32px/1 'Noto Sans JP',sans-serif;
      display:flex;align-items:center;gap:10px;
      pointer-events:none;user-select:none;transition:opacity .2s ease`;
    this.el.innerHTML = `🔥 <span id="cnt">0</span>`;
    this.el.style.opacity = '0';
  }

  /** Attach to DOM – idempotent */
  mount() {
    if (!document.body.contains(this.el)) document.body.appendChild(this.el);
  }

  /** Remove from DOM */
  unmount() {
    if (this.el.parentElement) this.el.parentElement.removeChild(this.el);
  }

  /** Update the displayed streak. Hidden when zero. */
  set(value: number) {
    const span = this.el.querySelector<HTMLSpanElement>('#cnt')!;
    span.textContent = String(value);
    if (value > 0) {
      this.el.style.opacity = '1';
      // small pop animation
      this.el.animate([{ transform: 'scale(1.2)' }, { transform: 'scale(1)' }], {
        duration: 150,
        easing: 'ease-out',
      });
    } else {
      this.el.style.opacity = '0';
    }
  }
}
