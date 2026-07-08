import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import { Lesson0 } from './Lesson0.tsx';

describe('Lesson0', () => {
  it('drills each page on the sound that page introduces, not always vowel length', () => {
    const onDone = vi.fn();
    render(<Lesson0 onDone={onDone} onSkip={() => undefined} />);

    // Page 1 teaches long vowels — its drill asks for the long syllable.
    expect(screen.getByText(/long syllable/)).toBeTruthy();
    fireEvent.click(screen.getByText('mā'));
    expect(screen.getByText('yes — the line means linger')).toBeTruthy();
    fireEvent.click(screen.getByText('continue'));

    // Page 2 teaches c = “ch” — its drill asks for the ch sound, and a wrong
    // pick hints about c, not about macrons.
    expect(screen.getByText(/tap the syllable that sounds like/)).toBeTruthy();
    fireEvent.click(screen.getByText('vi'));
    expect(screen.getByText(/listen again — c always/)).toBeTruthy();
    fireEvent.click(screen.getByText('cā'));
    fireEvent.click(screen.getByText('continue'));

    // Page 3 teaches aspirates — its drill asks for the puff of breath.
    expect(screen.getByText(/tap the syllable with the puff of breath/)).toBeTruthy();
    fireEvent.click(screen.getByText('kha'));
    fireEvent.click(screen.getByText(/done — the sounds are yours/));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
