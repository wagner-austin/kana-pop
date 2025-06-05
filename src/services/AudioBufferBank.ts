export default class AudioBufferBank {
  private ctx?: AudioContext;
  private bank = new Map<string, AudioBuffer>();
  private isIOS: boolean;
  private isSafari: boolean;
  private isIPadOS: boolean;

  constructor() {
    // More robust device and browser detection
    const ua = navigator.userAgent;
    this.isIOS =
      /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream: unknown }).MSStream;
    this.isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    this.isIPadOS =
      /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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

      try {
        // Create with options for iOS Safari compatibility
        this.ctx = new Ctor({ latencyHint: 'interactive' });
        // helpful while debugging
        this.ctx.onstatechange = () => console.warn('[Audio] state →', this.ctx!.state);
      } catch (error) {
        console.error('[Audio] Failed to create AudioContext:', error);
        // Fallback to basic initialization
        this.ctx = new Ctor();
        this.ctx.onstatechange = () => console.warn('[Audio] state →', this.ctx!.state);
      }
    }

    // On iOS/iPadOS, the context state handling is different
    // AudioContext.state can be 'suspended', 'running', or 'closed'
    if (this.ctx.state === 'suspended') {
      console.warn(`[Audio] Attempting to resume context from ${this.ctx.state} state...`);
      try {
        // For iOS/iPadOS Safari, make several attempts with specific handling
        if (this.isIOS || this.isIPadOS) {
          // First attempt
          await this.ctx.resume();

          // Multiple resume attempts with increasing delays
          if (this.ctx.state === 'suspended') {
            console.warn("[Audio] First resume attempt didn't work, trying again...");
            // Small delay before second attempt (helps on some iOS versions)
            for (let delay of [100, 300, 500]) {
              // Try with increasing delays
              await new Promise((resolve) => setTimeout(resolve, delay));
              console.warn(`[Audio] Resume attempt with delay ${delay}ms...`);
              await this.ctx.resume();

              // Explicitly check state against string for TypeScript compatibility
              if ((this.ctx.state as string) === 'running') {
                console.warn(`[Audio] Context resumed after ${delay}ms delay`);
                break;
              }
            }
          }

          // Special handling for Safari on iPadOS
          if (this.isIPadOS && this.isSafari && this.ctx.state === 'suspended') {
            console.warn('[Audio] iPadOS Safari detected, trying special handling...');
            // Force a node creation and connection to trigger audio system
            const tempNode = this.ctx.createGain();
            tempNode.connect(this.ctx.destination);
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

  /** Call from your unlock-gesture to satisfy iOS/iPadOS */
  async resume() {
    try {
      // Create empty buffer (needed on iOS/iPadOS devices)
      const ctx = await this.context(); // lazily create + resume

      if (this.isIOS || this.isIPadOS) {
        // On iOS/iPadOS, playing a short buffer can help unlock audio
        // Create a longer buffer for better compatibility with Safari
        const sampleRate = ctx.sampleRate || 44100;
        const silentBuffer = ctx.createBuffer(1, sampleRate * 0.1, sampleRate); // 100ms buffer

        // Safari on iPad sometimes needs multiple unlock attempts
        const playDuration = this.isIPadOS && this.isSafari ? 0.05 : 0.001; // Longer for iPad Safari

        // Try with multiple nodes for iPad Safari
        const gain = ctx.createGain();
        gain.gain.value = 0.1;

        const source = ctx.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(gain);
        gain.connect(ctx.destination);

        source.start(0);
        source.stop(playDuration); // Slightly longer for iPad Safari

        console.warn(
          `[Audio] iOS/iPadOS unlock attempt with silent buffer (duration: ${playDuration}s)`,
        );

        // For iPad Safari, sometimes we need a second attempt after a delay
        if (this.isIPadOS && this.isSafari) {
          await new Promise((resolve) => setTimeout(resolve, 300));
          if (ctx.state === 'suspended') {
            console.warn('[Audio] iPad Safari still suspended, trying one more unlock attempt');
            const source2 = ctx.createBufferSource();
            source2.buffer = silentBuffer;
            source2.connect(ctx.destination);
            source2.start(0);
            await ctx.resume();
          }
        }
      }

      return ctx;
    } catch (err) {
      console.error('[Audio] Resume failed:', err);
      throw err;
    }
  }
}
