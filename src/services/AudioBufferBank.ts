export default class AudioBufferBank {
  private ctx?: AudioContext;
  private bank = new Map<string, AudioBuffer>();
  private isIOS: boolean;

  constructor() {
    // Check if this is an iOS device
    this.isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as unknown as { MSStream: unknown }).MSStream;
  }

  /** make sure ctx exists *and* is running */
  private async context(): Promise<AudioContext> {
    if (!this.ctx) {
      /* Pick the available constructor *now*, inside the gesture */
      const globalAudio = globalThis as typeof globalThis & {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctor = globalAudio.AudioContext ?? globalAudio.webkitAudioContext;
      if (!Ctor) throw new Error('Web Audio API not supported');
      this.ctx = new Ctor();
      // helpful while debugging
      this.ctx.onstatechange = () => console.warn('[Audio] state →', this.ctx!.state);
    }

    // On iOS, the context state handling is different
    // AudioContext.state can be 'suspended', 'running', or 'closed'
    if (this.ctx.state === 'suspended') {
      console.warn(`[Audio] Attempting to resume context from ${this.ctx.state} state...`);
      try {
        // For iOS, make several attempts if needed
        if (this.isIOS) {
          // First attempt
          await this.ctx.resume();

          // On iOS, sometimes a second resume attempt is needed
          if (this.ctx.state === 'suspended') {
            console.warn("[Audio] First resume attempt didn't work, trying again...");
            // Small delay before second attempt (helps on some iOS versions)
            await new Promise((resolve) => setTimeout(resolve, 100));
            await this.ctx.resume();
          }
        } else {
          // Non-iOS standard approach
          await this.ctx.resume();
        }

        console.warn(`[Audio] Context resumed successfully: ${this.ctx.state}`);
      } catch (err) {
        console.error('Error resuming AudioContext:', err);
        throw err;
      }
    }

    return this.ctx;
  }

  async fetch(url: string): Promise<AudioBuffer> {
    if (this.bank.has(url)) return this.bank.get(url)!;

    /* attempt to fetch & decode */

    const data = await (await fetch(url)).arrayBuffer();
    const ctx = await this.context(); // ⬅️ running for sure

    try {
      const buf = await ctx.decodeAudioData(data);
      this.bank.set(url, buf);
      return buf;
    } catch (error) {
      console.error(`AudioBufferBank: decodeAudioData failed for ${url}`, error);
      // Propagate the error so SoundService can potentially use a fallback
      throw error;
    }
  }

  async play(buf: AudioBuffer) {
    const ctx = await this.context();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
  }

  /** Call from your unlock-gesture to satisfy iOS */
  async resume() {
    try {
      // Create empty buffer for iOS (needed on some iOS versions)
      const ctx = await this.context(); // lazily create + resume

      if (this.isIOS) {
        // On iOS, playing a short buffer can help unlock audio
        const silentBuffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(ctx.destination);
        source.start(0);
        source.stop(0.001); // Very short sound
        console.warn('[Audio] iOS unlock attempt with silent buffer');
      }

      return ctx;
    } catch (err) {
      console.error('[Audio] Resume failed:', err);
      throw err;
    }
  }
}
