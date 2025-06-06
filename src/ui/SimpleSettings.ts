import { TEXT_COLOUR_DARK } from '@/config/constants';
import Haptics from '@/services/HapticService';

export default class SimpleSettings {
  private overlay = document.createElement('div');

  constructor(private onClose: () => void) {
    this.overlay.style.cssText = `
      position:fixed;inset:0;background:rgba(0,0,0,.6);
      color:${TEXT_COLOUR_DARK};display:flex;flex-direction:column;
      align-items:center;justify-content:center;
      font:18px sans-serif;z-index:50`;

    this.overlay.innerHTML = `
      <h2 style="margin:0 0 20px">Settings</h2>
      <label style="margin-bottom:15px;display:flex;align-items:center;gap:8px">
        <input type="checkbox" id="hapticsToggle">
        Haptics
      </label>
      <button id="close">Close</button>`;

    this.overlay.querySelector('#close')!.addEventListener('click', () => this.toggle());

    /* wire checkbox */
    const chk = this.overlay.querySelector<HTMLInputElement>('#hapticsToggle')!;
    chk.addEventListener('change', () => {
      Haptics.setEnabled(chk.checked);
    });
  }

  toggle() {
    if (document.body.contains(this.overlay)) {
      this.hide();
    } else {
      this.show();
    }
  }
  show() {
    document.body.appendChild(this.overlay);
    /* refresh checkbox from current setting */
    const chk = this.overlay.querySelector<HTMLInputElement>('#hapticsToggle')!;
    chk.checked = Haptics.isEnabled();
  }
  hide() {
    this.overlay.remove();
    this.onClose();
  }
}
