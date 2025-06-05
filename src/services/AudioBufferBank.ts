import { requiresSpecialAudioHandling } from '@/utils/DeviceInfo';
import Logger from '@/utils/Logger';

const log = new Logger('Audio');

export default class AudioBufferBank {
  private ctx?: AudioContext;
  private bank = new Map<string, AudioBuffer>();

  constructor() {
    // Empty constructor - context is created lazily when needed
  }

  /**
   * Ensures the AudioContext exists and is in the running state
   * This is the single point of access for the AudioContext
   */
  private async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      /* Pick the available constructor *now*, inside the gesture */
      const globalAudio = globalThis as typeof globalThis & {
        AudioContext?: typeof AudioContext;
        webkitAudioContext?: typeof AudioContext;
      };
      const Ctor = globalAudio.AudioContext ?? globalAudio.webkitAudioContext;
      if (!Ctor) throw new Error('Web Audio API not supported');

      // Create the context - no need for latencyHint options as they add complexity without benefit
      this.ctx = new Ctor();

      // Add debug state change handler only in development
      if (import.meta.env.DEV) {
        this.ctx.onstatechange = () => log.debug(`Audio context state → ${this.ctx!.state}`);
      }

      log.info(`Created new AudioContext: ${this.ctx.state}`);
    }

    // Resume the context if needed
    if (this.ctx.state === 'suspended') {
      log.info(`Attempting to resume AudioContext from ${this.ctx.state} state`);

      try {
        await this.ctx.resume();
        log.info(`AudioContext resumed: ${this.ctx.state}`);
      } catch (err) {
        log.error('Failed to resume AudioContext', err);
        throw err;
      }
    }

    return this.ctx;
  }

  async fetch(url: string): Promise<AudioBuffer> {
    if (this.bank.has(url)) return this.bank.get(url)!;

    /* attempt to fetch & decode */
    try {
      const data = await (await fetch(url)).arrayBuffer();
      const ctx = await this.ensureContext(); // ⬅️ running for sure

      const buf = await ctx.decodeAudioData(data);
      this.bank.set(url, buf);
      return buf;
    } catch (error) {
      log.error(`decodeAudioData failed for ${url}`, error);
      // Propagate the error so SoundService can potentially use a fallback
      throw error;
    }
  }

  async play(buf: AudioBuffer) {
    const ctx = await this.ensureContext();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();

    // Clean up nodes after they finish playing
    src.onended = () => src.disconnect();
  }

  /**
   * Call from your unlock-gesture to satisfy iOS/iPadOS audio restrictions
   * Initializes audio context and plays a silent buffer if needed
   */
  async resume(): Promise<AudioContext> {
    try {
      // First ensure the context exists and is resumed
      const ctx = await this.ensureContext();

      // Only play silent buffer on iOS/iPadOS devices
      if (requiresSpecialAudioHandling()) {
        log.info('iOS/iPadOS detected, playing silent buffer to unlock audio');

        // Create a longer silent buffer for more reliable unlocking
        const sampleRate = ctx.sampleRate || 44100;
        const silentBuffer = ctx.createBuffer(2, sampleRate * 0.5, sampleRate); // 500ms stereo buffer

        // Fill the buffer with silence (all zeros)
        for (let channel = 0; channel < 2; channel++) {
          const data = silentBuffer.getChannelData(channel);
          for (let i = 0; i < data.length; i++) {
            data[i] = 0;
          }
        }

        // For iPads, use a longer duration to ensure unlocking
        const playDuration = requiresSpecialAudioHandling() ? 0.5 : 0.1;

        // Create and connect nodes
        const gain = ctx.createGain();
        gain.gain.value = 0.001; // Nearly silent but not quite zero (avoids optimization)

        const source = ctx.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(gain);
        gain.connect(ctx.destination);

        // Play the silent buffer
        source.start(0);
        source.stop(ctx.currentTime + playDuration);

        // Clean up nodes when finished
        source.onended = () => {
          source.disconnect();
          gain.disconnect();
        };

        log.info(`Silent buffer played (duration: ${playDuration}s)`);
      }

      return ctx;
    } catch (err) {
      log.error('Resume failed', err);
      throw err;
    }
  }
}
