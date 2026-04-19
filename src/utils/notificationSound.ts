/**
 * Notification Sound Utility
 */

let globalAudioCtx: AudioContext | null = null;
let isInitialized = false;

/**
 * Initialize AudioContext
 */
export const initAudio = async () => {
  if (isInitialized && globalAudioCtx && globalAudioCtx.state === 'running') {
    return globalAudioCtx;
  }

  try {
    if (!globalAudioCtx) {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        globalAudioCtx = new AudioContextClass();
      }
    }

    if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
      await globalAudioCtx.resume().catch(() => {});
    }

    isInitialized = true;
    return globalAudioCtx;
  } catch (error) {
    return null;
  }
};

/**
 * Unlock audio on first interaction
 */
const unlockAudio = async () => {
  const ctx = await initAudio();
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume().catch(() => {});
  }
  
  if (ctx && ctx.state === 'running') {
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
    console.log('[Sound] AudioContext unlocked and running');
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
}

/**
 * Play sound
 */
export const playNotificationSound = async () => {
  const soundEnabled = localStorage.getItem('notifications_sound') !== 'false';
  if (!soundEnabled) return;

  // Primary method: Web Audio API (Oscillator)
  try {
    const ctx = await initAudio();
    if (ctx && ctx.state === 'running') {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now); // E6
      osc2.detune.setValueAtTime(4, now);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.2);
      osc2.stop(now + 1.2);
      return; // Success
    }
  } catch (error) {
    console.warn('[Sound] Web Audio failed, trying fallback');
  }

  // Fallback: Simple Audio element (more likely to be blocked by browser if no interaction)
  try {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.volume = 0.4;
    await audio.play();
  } catch (e) {
    console.debug('[Sound] Fallback audio also blocked (normal if no interaction)');
  }
};
