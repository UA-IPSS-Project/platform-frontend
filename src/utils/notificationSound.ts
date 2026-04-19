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
      globalAudioCtx = new AudioContextClass();
    }

    if (globalAudioCtx.state === 'suspended') {
      // Only attempt to resume. Browser will decide if it's allowed.
      // We don't await it here to avoid blocking and we don't catch/log as error 
      // if it's not allowed, to keep the console clean.
      globalAudioCtx.resume().catch(() => {
        /* Silently fail - browser didn't allow it yet */
      });
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
    console.log('[Audio] Successfully unlocked and running');
    window.removeEventListener('click', unlockAudio);
    window.removeEventListener('keydown', unlockAudio);
    window.removeEventListener('touchstart', unlockAudio);
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

  try {
    const ctx = await initAudio();
    // Only play if the context is actually running
    if (!ctx || ctx.state !== 'running') {
      return;
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now);
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
  } catch (error) {
    // Ignore sound errors
  }
};
