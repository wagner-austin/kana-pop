export default class AudioBufferBank {
  private ctx?: AudioContext;
  private bank = new Map<string, AudioBuffer>();

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
    // On some Safari versions, the context might be 'interrupted' instead of 'suspended'
    if (this.ctx.state !== 'running') {
      try {
        await this.ctx.resume(); // successfully resumed
      } catch (err) {
        console.error('Error resuming AudioContext:', err);
        // Rethrow or handle as appropriate for your app's error strategy
        throw err;
      }
    }
    // You can expose this.ctx for manual inspection during development by
    // attaching it to a typed global in a local-only debug helper instead of
    // polluting production builds.
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
    await this.context(); // lazily create + resume
  }
}
