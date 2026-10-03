import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpeakButton } from './SpeakButton.tsx';

const metta = { id: 'metta', pali: 'mettā' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SpeakButton', () => {
  it('plays the bundled clip only when tapped, cutting off the previous one', () => {
    const played: { src: string; pause: ReturnType<typeof vi.fn> }[] = [];
    vi.stubGlobal(
      'Audio',
      class {
        pause = vi.fn();
        constructor(public src: string) {
          played.push(this);
        }
        play() {
          return Promise.resolve();
        }
      },
    );
    render(<SpeakButton word={metta} />);
    expect(played).toHaveLength(0);
    const button = screen.getByLabelText('hear mettā pronounced');
    fireEvent.click(button);
    fireEvent.click(button);
    expect(played.map((a) => a.src)).toEqual(['/audio/metta.mp3', '/audio/metta.mp3']);
    expect(played[0]?.pause).toHaveBeenCalled();
  });
});
