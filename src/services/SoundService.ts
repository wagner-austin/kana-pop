class SoundService {
  private cache = new Map<string, HTMLAudioElement>();

  play(path: string) {
    // The path includes the language code, e.g., "ja/fallback.mp3"
    // If the specific audio file (without lang prefix) is 'fallback.mp3', skip playback.
    if (path.endsWith('fallback.mp3')) {
      // console.log('Skipping playback for fallback.mp3');
      return;
    }
    const url = `/audio/${path}`; // Assuming audio files are in /public/audio/
    let el = this.cache.get(url);
    if (!el) {
      el = new Audio(url);
      this.cache.set(url, el);
    }

    el.currentTime = 0;
    el.play().catch((_error) => {
      // Ignore errors, especially those related to user gesture requirements for autoplay.
      // console.warn(`Audio playback failed for ${url}:`, error);
    });
  }
}

export default new SoundService();
