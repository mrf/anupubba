let shared: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  shared ??= new AudioContext();
  return shared;
}

/**
 * Bell to open, bell to close (§5) — a synthesized standing-bell strike,
 * so no audio asset is needed. Inharmonic partials approximate real bells.
 * Must be called from a user gesture or the browser will keep it silent.
 */
export function ringBell(kind: 'open' | 'close'): void {
  const audio = context();
  if (audio === null) return;
  void audio.resume();
  const base = kind === 'open' ? 528 : 396;
  const now = audio.currentTime;
  const partials: readonly (readonly [number, number])[] = [
    [1, 0.3],
    [2.76, 0.1],
    [5.4, 0.04],
  ];
  for (const [ratio, gain] of partials) {
    const osc = audio.createOscillator();
    const amp = audio.createGain();
    osc.type = 'sine';
    osc.frequency.value = base * ratio;
    amp.gain.setValueAtTime(gain, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 6);
    osc.connect(amp);
    amp.connect(audio.destination);
    osc.start(now);
    osc.stop(now + 6);
  }
}
