/**
 * Tap-to-hear pronunciation from bundled clips (public/audio/<id>.mp3),
 * rendered ahead of time with eSpeak NG by scripts/gen-audio.mjs.
 *
 * Plain audio files rather than the browser's speech engine: device voices
 * proved unreliable — iOS Safari reports speaking yet stays silent, and
 * stock Windows and Firefox have no Hindi voice at all. A media clip plays
 * the same everywhere, offline (the service worker precaches them), and is
 * treated by iOS as media rather than muted speech.
 */

let current: HTMLAudioElement | null = null;

export function clipUrl(wordId: string): string {
  return `${import.meta.env.BASE_URL}audio/${wordId}.mp3`;
}

/** Play a word's clip, cutting off any clip still playing. Call from a tap. */
export function playPronunciation(wordId: string): void {
  current?.pause();
  const audio = new Audio(clipUrl(wordId));
  current = audio;
  audio.play().catch(() => {
    // Autoplay refusals and missing files fail quietly: the written guide
    // is still on the card.
  });
}
