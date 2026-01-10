/**
 * Timer class for 15-minute focused work sessions
 */
export class Timer {
  constructor(minutes = 15) {
    this.duration = minutes * 60; // Convert to seconds
    this.remaining = this.duration;
    this.isRunning = false;
    this.interval = null;
    this.onTick = null;
    this.onComplete = null;
  }

  /**
   * Set the duration in minutes
   * @param {number} minutes
   */
  setDuration(minutes) {
    this.duration = minutes * 60;
    if (!this.isRunning) {
      this.remaining = this.duration;
    }
  }

  /**
   * Start or resume the timer
   * @param {Function} onTick - Called every second with remaining time
   * @param {Function} onComplete - Called when timer reaches zero
   */
  start(onTick, onComplete) {
    if (this.isRunning) return;

    this.onTick = onTick || this.onTick;
    this.onComplete = onComplete || this.onComplete;
    this.isRunning = true;

    this.interval = setInterval(() => {
      this.remaining--;

      if (this.onTick) {
        this.onTick(this.remaining);
      }

      if (this.remaining <= 0) {
        this.complete();
      }
    }, 1000);
  }

  /**
   * Pause the timer
   */
  pause() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Reset the timer to initial duration
   */
  reset() {
    this.pause();
    this.remaining = this.duration;
  }

  /**
   * Called when timer completes
   */
  complete() {
    this.pause();
    this.remaining = 0;

    if (this.onComplete) {
      this.onComplete();
    }
  }

  /**
   * Play a gentle notification sound
   * Uses Web Audio API to create a pleasant chime
   */
  playNotification() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();

      // Create a more pleasant multi-tone chime
      const playTone = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        // Start quiet, fade in slightly, then fade out
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = audioContext.currentTime;

      // Play a pleasant three-note chime (C5, E5, G5)
      playTone(523.25, now, 0.5);       // C5
      playTone(659.25, now + 0.15, 0.5); // E5
      playTone(783.99, now + 0.3, 0.7);  // G5

    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  /**
   * Format seconds as MM:SS
   * @param {number} seconds
   * @returns {string}
   */
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Get formatted remaining time
   * @returns {string}
   */
  getFormattedTime() {
    return Timer.formatTime(this.remaining);
  }
}
