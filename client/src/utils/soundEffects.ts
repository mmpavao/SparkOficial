// Sound Effects System for Financial Actions
// Provides audio feedback for positive financial interactions

export type SoundType = 
  | 'credit_approved' 
  | 'payment_success' 
  | 'status_change' 
  | 'notification' 
  | 'document_upload'
  | 'form_submit'
  | 'financial_calculation';

interface SoundConfig {
  frequency: number;
  duration: number;
  volume: number;
  type: OscillatorType;
}

// Sound configurations for different financial actions
const SOUND_CONFIGS: Record<SoundType, SoundConfig[]> = {
  credit_approved: [
    { frequency: 523.25, duration: 200, volume: 0.3, type: 'sine' }, // C5
    { frequency: 659.25, duration: 200, volume: 0.25, type: 'sine' }, // E5
    { frequency: 783.99, duration: 300, volume: 0.2, type: 'sine' }   // G5
  ],
  payment_success: [
    { frequency: 440, duration: 150, volume: 0.25, type: 'sine' },    // A4
    { frequency: 554.37, duration: 150, volume: 0.2, type: 'sine' },  // C#5
    { frequency: 659.25, duration: 200, volume: 0.15, type: 'sine' }  // E5
  ],
  status_change: [
    { frequency: 349.23, duration: 100, volume: 0.2, type: 'sine' },  // F4
    { frequency: 523.25, duration: 150, volume: 0.15, type: 'sine' }  // C5
  ],
  notification: [
    { frequency: 800, duration: 100, volume: 0.15, type: 'sine' },
    { frequency: 1000, duration: 80, volume: 0.1, type: 'sine' }
  ],
  document_upload: [
    { frequency: 262.81, duration: 120, volume: 0.2, type: 'sine' }   // C4
  ],
  form_submit: [
    { frequency: 523.25, duration: 100, volume: 0.15, type: 'sine' }  // C5
  ],
  financial_calculation: [
    { frequency: 392, duration: 80, volume: 0.12, type: 'sine' },     // G4
    { frequency: 523.25, duration: 80, volume: 0.1, type: 'sine' }    // C5
  ]
};

class SoundEffectManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Initialize audio context on first user interaction
    this.initializeAudioContext();
  }

  private initializeAudioContext() {
    try {
      // Create audio context only when needed
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
    } catch (error) {
      console.warn('Audio context not supported:', error);
      this.isEnabled = false;
    }
  }

  private async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Could not resume audio context:', error);
      }
    }
  }

  private playTone(config: SoundConfig, delay: number = 0): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext || !this.isEnabled) {
        resolve();
        return;
      }

      setTimeout(() => {
        try {
          const oscillator = this.audioContext!.createOscillator();
          const gainNode = this.audioContext!.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(this.audioContext!.destination);

          oscillator.frequency.setValueAtTime(config.frequency, this.audioContext!.currentTime);
          oscillator.type = config.type;

          // Smooth volume envelope
          gainNode.gain.setValueAtTime(0, this.audioContext!.currentTime);
          gainNode.gain.linearRampToValueAtTime(config.volume, this.audioContext!.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext!.currentTime + config.duration / 1000);

          oscillator.start(this.audioContext!.currentTime);
          oscillator.stop(this.audioContext!.currentTime + config.duration / 1000);

          oscillator.onended = () => resolve();
        } catch (error) {
          console.warn('Error playing sound:', error);
          resolve();
        }
      }, delay);
    });
  }

  async playSound(soundType: SoundType): Promise<void> {
    if (!this.isEnabled) return;

    this.initializeAudioContext();
    await this.resumeAudioContext();

    const configs = SOUND_CONFIGS[soundType];
    if (!configs) return;

    // Play tones in sequence with slight delays for musical effect
    for (let i = 0; i < configs.length; i++) {
      this.playTone(configs[i], i * 80);
    }
  }

  // Enable/disable sound effects
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    
    // Store preference in localStorage
    try {
      localStorage.setItem('spark-comex-sounds', enabled.toString());
    } catch (error) {
      console.warn('Could not save sound preference:', error);
    }
  }

  // Get current enabled state
  isEnabledState(): boolean {
    return this.isEnabled;
  }

  // Load sound preference from localStorage
  loadPreference() {
    try {
      const saved = localStorage.getItem('spark-comex-sounds');
      if (saved !== null) {
        this.isEnabled = saved === 'true';
      }
    } catch (error) {
      console.warn('Could not load sound preference:', error);
    }
  }
}

// Global instance
export const soundManager = new SoundEffectManager();

// Load user preference on initialization
soundManager.loadPreference();

// Convenience functions for common financial actions
export const playApprovalSound = () => soundManager.playSound('credit_approved');
export const playPaymentSound = () => soundManager.playSound('payment_success');
export const playStatusChangeSound = () => soundManager.playSound('status_change');
export const playNotificationSound = () => soundManager.playSound('notification');
export const playUploadSound = () => soundManager.playSound('document_upload');
export const playSubmitSound = () => soundManager.playSound('form_submit');
export const playCalculationSound = () => soundManager.playSound('financial_calculation');

// Hook for React components
export const useSoundEffects = () => {
  return {
    playApprovalSound,
    playPaymentSound,
    playStatusChangeSound,
    playNotificationSound,
    playUploadSound,
    playSubmitSound,
    playCalculationSound,
    setEnabled: (enabled: boolean) => soundManager.setEnabled(enabled),
    isEnabled: () => soundManager.isEnabledState()
  };
};