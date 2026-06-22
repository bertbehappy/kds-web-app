let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playNotificationSound(type: string) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const now = ctx.currentTime;
    
    if (type === 'bell') {
      // Resonant, elegant brass bell sound using multiple sine oscillators for realistic chime timbre
      const freqs = [587.33, 880.00, 1174.66]; // D5, A5, D6
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      gainNode.connect(ctx.destination);

      freqs.forEach((f, index) => {
        const osc = ctx.createOscillator();
        osc.type = index === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(f, now);
        osc.connect(gainNode);
        osc.start(now);
        osc.stop(now + 1.6);
      });
    } else if (type === 'chime') {
      // Sparkling wind chime effect - rapid cascading high notes
      const times = [0, 0.1, 0.2];
      const notes = [987.77, 1318.51, 1567.98]; // B5, E6, G6
      
      notes.forEach((freq, idx) => {
        const t = now + times[idx];
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(0.15, t + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        gainNode.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.connect(gainNode);
        osc.start(t);
        osc.stop(t + 0.7);
      });
    } else {
      // 'default' crisp electronic POS terminal double-beep
      const beeps = [0, 0.15];
      const noteFreqs = [880, 880];
      
      beeps.forEach((time, idx) => {
        const t = now + time;
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, t);
        gainNode.gain.linearRampToValueAtTime(0.2, t + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        gainNode.connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(noteFreqs[idx], t);
        osc.connect(gainNode);
        osc.start(t);
        osc.stop(t + 0.15);
      });
    }
  } catch (error) {
    console.warn('Failed to play notification sound:', error);
  }
}
