import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { Lesson0 } from './Lesson0.tsx';

/** Assert a page's drill prompt, optionally miss once and check its hint, then solve it. */
function solvePage(page: { prompt: RegExp; answer: string; wrong?: string; hint?: RegExp }) {
  expect(screen.getByText(page.prompt)).toBeTruthy();
  if (page.wrong !== undefined) {
    fireEvent.click(screen.getByText(page.wrong));
    if (page.hint !== undefined) {
      expect(screen.getByText(page.hint)).toBeTruthy();
    }
  }
  fireEvent.click(screen.getByText(page.answer));
}

describe('Lesson0', () => {
  it('drills each page on the sound that page introduces, not always vowel length', () => {
    const onDone = vi.fn();
    render(<Lesson0 onDone={onDone} onSkip={() => undefined} />);

    // Page 1 teaches long vowels — its drill asks for the long syllable.
    solvePage({ prompt: /tap the long syllable in samādhi/, answer: 'mā' });
    expect(screen.getByText('yes — the line means linger')).toBeTruthy();
    fireEvent.click(screen.getByText('continue'));

    // Page 2 teaches c = “ch” — a wrong pick hints about c, not about macrons.
    solvePage({
      prompt: /tap the syllable that sounds like/,
      answer: 'cā',
      wrong: 'vi',
      hint: /listen again — c always/,
    });
    fireEvent.click(screen.getByText('continue'));

    // Page 3 teaches aspirates, warning off the two classic misreadings
    // (th as in "thin", ph as "f").
    expect(screen.getByText(/never the th of/)).toBeTruthy();
    solvePage({ prompt: /tap the syllable with the puff of breath/, answer: 'kha' });
    fireEvent.click(screen.getByText('continue'));

    // Page 4 teaches ṅ — the "ng" nasal.
    solvePage({
      prompt: /tap the syllable with the “ng” in saṅkhāra/,
      answer: 'saṅ',
      wrong: 'khā',
      hint: /listen again — ṅ is the “ng”/,
    });
    fireEvent.click(screen.getByText('continue'));

    // Page 5 teaches e and o as long-by-nature — no macron to lean on.
    solvePage({ prompt: /tap the long syllable in bodhi/, answer: 'bo' });
    expect(screen.getByText(/o is long without any line/)).toBeTruthy();
    fireEvent.click(screen.getByText('continue'));

    // Page 6 teaches syllable weight — doubled consonants, not just macrons.
    solvePage({ prompt: /tap the heavy syllable in anicca/, answer: 'nic' });
    fireEvent.click(screen.getByText(/done — the sounds are yours/));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
