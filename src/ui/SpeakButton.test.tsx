import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpeakButton } from './SpeakButton.tsx';

class FakeUtterance {
  voice: SpeechSynthesisVoice | null = null;
  lang = '';
  rate = 1;
  constructor(public text: string) {}
}

function installSpeech(langs: readonly string[]) {
  const voices = langs.map((lang) => ({ lang, localService: true, name: lang, voiceURI: lang, default: false }));
  const engine = {
    getVoices: () => voices,
    speak: vi.fn(),
    cancel: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal('speechSynthesis', engine);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  return engine;
}

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
