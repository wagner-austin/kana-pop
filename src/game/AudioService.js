/**
 * AudioService.js
 * Handles all audio playback and lazy-loading of audio assets
 */

class AudioService {
  constructor() {
    this.audioContext = null;
    this.buffers = new Map();
    this.isMuted = false;
    this.sources = [];
    this.initialized = false;
  }

  /**
   * Initialize the audio context (must be called from a user interaction)
   */
  init() {
    if (this.initialized) return;

    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Ensure the audio context is running (it might be suspended on some browsers)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('AudioContext resumed successfully');
        }).catch(err => {
          console.warn('Failed to resume AudioContext:', err);
        });
      }
      
      this.initialized = true;
      console.log('Audio service initialized successfully');
    } catch (error) {
      console.error('Web Audio API is not supported in this browser', error);
    }
  }

  /**
   * Preload an audio file
   * @param {string} id - Unique identifier for the sound
   * @param {string} url - Primary URL for the audio file
   * @param {string[]} fallbacks - Optional fallback URLs for browser compatibility
   * @returns {Promise<boolean>} Whether loading was successful
   */
  async preload(id, url, fallbacks = []) {
    if (!this.initialized) {
      this.init();
    }
    
    if (!this.audioContext) {
      console.warn(`Cannot preload audio '${id}': AudioContext not initialized`);
      return false;
    }

    // Skip if already loaded
    if (this.buffers.has(id)) {
      console.log(`Audio '${id}' already loaded, skipping`);
      return true;
    }

    // Try the main URL first, then fallbacks
    const urls = [url, ...fallbacks];
    console.log(`Attempting to load audio '${id}' with URLs:`, urls);
    
    for (const audioUrl of urls) {
      try {
        console.log(`Fetching: ${audioUrl}`);
        const response = await fetch(audioUrl);
        
        if (!response.ok) {
          console.warn(`HTTP error ${response.status} loading audio: ${audioUrl}`);
          continue;
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.log(`Successfully fetched ${audioUrl}, decoding audio...`);
        
        try {
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.buffers.set(id, audioBuffer);
          console.log(`Successfully loaded audio: ${id}`);
          return true;
        } catch (decodeError) {
          console.warn(`Failed to decode audio: ${audioUrl}`, decodeError);
        }
      } catch (fetchError) {
        console.warn(`Failed to fetch audio: ${audioUrl}`, fetchError);
      }
    }
    
    console.error(`Could not load audio: ${id} after trying all URLs`);
    return false;
  }

  /**
   * Play a sound by its ID
   * @param {string} id - Sound identifier
   * @param {number} volume - Volume level (0-1)
   * @param {boolean} loop - Whether to loop the sound
   * @returns {number|null} ID of the sound source or null if playback failed
   */
  play(id, volume = 1.0, loop = false) {
    if (this.isMuted || !this.initialized || !this.audioContext) {
      return null;
    }

    // Try to load on demand if not preloaded
    if (!this.buffers.has(id)) {
      console.warn(`Audio not preloaded: ${id}`);
      return null;
    }

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = this.buffers.get(id);
      source.loop = loop;
      
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
      
      // Store source for potential stop later
      const sourceId = Date.now();
      this.sources.push({ id: sourceId, source, gainNode });
      
      // Cleanup when playback ends
      source.onended = () => {
        this.sources = this.sources.filter(s => s.id !== sourceId);
      };
      
      return sourceId;
    } catch (error) {
      console.error(`Failed to play audio: ${id}`, error);
      return null;
    }
  }

  /**
   * Stop a specific playing sound
   * @param {number} sourceId - ID returned by play()
   */
  stop(sourceId) {
    const sourceObj = this.sources.find(s => s.id === sourceId);
    if (sourceObj) {
      try {
        sourceObj.source.stop();
      } catch (error) {
        console.warn(`Failed to stop audio: ${sourceId}`, error);
      }
      this.sources = this.sources.filter(s => s.id !== sourceId);
    }
  }

  /**
   * Stop all playing sounds
   */
  stopAll() {
    this.sources.forEach(({ source }) => {
      try {
        source.stop();
      } catch (error) {
        // Ignore errors when stopping
      }
    });
    this.sources = [];
  }

  /**
   * Set the mute state
   * @param {boolean} muted - Whether audio should be muted
   */
  setMuted(muted) {
    this.isMuted = muted;
    if (muted) {
      this.stopAll();
    }
  }

  /**
   * Toggle the mute state
   * @returns {boolean} New mute state
   */
  toggleMute() {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Preload a batch of audio files
   * @param {Object[]} audioList - List of {id, url, fallbacks} objects
   * @returns {Promise<boolean>} Whether all files were loaded successfully
   */
  async preloadBatch(audioList) {
    if (!Array.isArray(audioList) || audioList.length === 0) {
      return false;
    }

    const results = await Promise.all(
      audioList.map(({ id, url, fallbacks = [] }) => 
        this.preload(id, url, fallbacks)
      )
    );

    return results.every(Boolean);
  }
}

// Export a singleton instance
export default new AudioService();
