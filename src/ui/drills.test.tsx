import { fireEvent, render, screen } from '@testing-library/preact';
import { describe, expect, it, vi } from 'vitest';
import type { WordCard } from '../data/types.ts';
import { RecallDrill } from './drills.tsx';

const metta: WordCard = {
  id: 'metta',
  pali: 'mettā',
  gloss: 'loving-kindness; goodwill',
  cluster: 'brahmaviharas',
  confusables: [],
  sources: [{ type: 'dictionary', ref: 'dpd:mettā', url: 'https://dpdict.net/?q=mettā' }],
  pronunciation: 'MET-taa',
};

/** Render the drill, type an answer, submit — returns the onDone spy. */
function renderAndCheck(value: string) {
  const onDone = vi.fn();
  render(<RecallDrill word={metta} onDone={onDone} />);
  fireEvent.input(screen.getByPlaceholderText(/type the Pali word/), { target: { value } });
  fireEvent.click(screen.getByText('check'));
  return onDone;
}

describe('RecallDrill', () => {
  it('accepts exact and ascii spellings with self-grading', () => {
    const onDone = renderAndCheck('metta');
    fireEvent.click(screen.getByText('clear'));
    expect(onDone).toHaveBeenCalledWith('clear');
  });

  it('accepts a close spelling but points at the exact one', () => {
    const onDone = renderAndCheck('meta');
    expect(screen.getByText(/close — the sounds are right/)).toBeTruthy();
    fireEvent.click(screen.getByText('familiar'));
    expect(onDone).toHaveBeenCalledWith('familiar');
  });

  it('still grades a different word as not yet', () => {
    const onDone = renderAndCheck('mudita');
    expect(screen.getByText(/not yet — it will come around again/)).toBeTruthy();
    fireEvent.click(screen.getByText('continue'));
    expect(onDone).toHaveBeenCalledWith('notYet');
  });
});
