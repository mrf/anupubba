import { act, fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FakeUtterance, installSpeech } from '../test/fakeSpeech.ts';
import { SpeakButton } from './SpeakButton.tsx';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SpeakButton', () => {
  it('speaks the word in Devanagari through an Indic voice on tap', () => {
    const engine = installSpeech(['en-US', 'hi-IN']);
    render(<SpeakButton pali="mettā" />);
    expect(engine.speak).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('hear mettā pronounced'));
    const spoken = engine.speak.mock.calls[0]?.[0] as FakeUtterance;
    expect(spoken.text).toBe('मेत्ता');
    expect(spoken.lang).toBe('hi-IN');
  });

  it('appears once voices load late, even without a voiceschanged event', () => {
    vi.useFakeTimers();
    const engine = installSpeech(['hi-IN']);
    const voices = engine.getVoices();
    engine.getVoices = () => [];
    const { container } = render(<SpeakButton pali="mettā" />);
    expect(container.innerHTML).toBe('');
    engine.getVoices = () => voices;
    void act(() => { vi.advanceTimersByTime(300); });
    expect(screen.getByLabelText('hear mettā pronounced')).toBeTruthy();
    vi.useRealTimers();
  });

  it('renders nothing when no suitable voice exists', () => {
    installSpeech(['en-US']);
    const { container } = render(<SpeakButton pali="mettā" />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when the browser has no speech engine', () => {
    const { container } = render(<SpeakButton pali="mettā" />);
    expect(container.innerHTML).toBe('');
  });
});
