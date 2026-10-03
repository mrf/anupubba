// Renders one pronunciation clip per word into public/audio/<id>.mp3 with
// eSpeak NG (Hindi phoneme set) and ffmpeg. Phonemes come from
// src/audio/phonemes.ts, so run with type stripping:
//   npm run audio            (needs espeak-ng and ffmpeg on PATH)
// Re-run after adding or respelling a word; the catalog test fails while
// any word is missing its clip.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { toPhonemes } from '../src/audio/phonemes.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const decks = join(root, 'src/data/decks');
const out = join(root, 'public/audio');
mkdirSync(out, { recursive: true });
const scratch = mkdtempSync(join(tmpdir(), 'anupubba-audio-'));

let count = 0;
for (const file of readdirSync(decks).sort()) {
  const deck = JSON.parse(readFileSync(join(decks, file), 'utf8'));
  for (const word of deck.words) {
    const wav = join(scratch, `${word.id}.wav`);
    // -s 120: unhurried, so each syllable can be heard; -g 2: a hair of
    // space between words in compounds like sammā-ājīva.
    execFileSync('espeak-ng', ['-v', 'hi', '-s', '120', '-g', '2', '-w', wav, `[[${toPhonemes(word.pali)}]]`]);
    execFileSync('ffmpeg', [
      '-loglevel', 'error', '-y', '-i', wav,
      '-ac', '1', '-ar', '22050', '-b:a', '48k',
      '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact',
      join(out, `${word.id}.mp3`),
    ]);
    count += 1;
  }
}
rmSync(scratch, { recursive: true });
console.log(`rendered ${count} clips into public/audio/`);
