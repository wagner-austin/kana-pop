type AudioContextCtor = typeof AudioContext | undefined;

/** Global object with optional Web-Audio constructors – typed, no `any` */
const globalAudio = globalThis as typeof globalThis & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

/** Pick whichever constructor the runtime provides (undefined in Node/Vitest) */
const AudioContextClass: AudioContextCtor =
  globalAudio.AudioContext ?? globalAudio.webkitAudioContext;

export default class AudioBufferBank {
  /** Absent in unit-test envs, present in every real browser. */
  private ctx: AudioContext | undefined = AudioContextClass ? new AudioContextClass() : undefined;

  private bank = new Map<string, AudioBuffer>();

  async fetch(url: string): Promise<AudioBuffer> {
    if (!this.ctx) throw new Error('AudioContext not available in this environment');

    if (this.bank.has(url)) return this.bank.get(url)!;

    const data = await (await fetch(url)).arrayBuffer();
    const buf = await new Promise<AudioBuffer>((res, rej) =>
      // Safari still needs the callback form for raw ArrayBuffers
      this.ctx!.decodeAudioData(data, res, rej),
    );

    this.bank.set(url, buf);
    return buf;
  }

  play(buf: AudioBuffer): void {
    if (!this.ctx) return; // no-op during tests
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.connect(this.ctx.destination);
    src.start();
  }

  /** Call from your unlock-gesture to satisfy iOS */
  resume(): Promise<void> {
    return this.ctx ? this.ctx.resume() : Promise.resolve();
  }
}
