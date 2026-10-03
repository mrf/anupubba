import { fireEvent, render, screen } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SpeakButton } from './SpeakButton.tsx';

class FakeUtterance {
  voice: SpeechSynthesisVoice | null = null;
  lang = '';
  rate = 1;
  readonly listeners: ((event: { error: string }) => void)[] = [];
  constructor(public text: string) {}
  addEventListener(_type: 'error', listener: (event: { error: string }) => void) {
    this.listeners.push(listener);
  }
}

function installSpeech(langs: readonly string[]) {
  const voices = langs.map((lang) => ({ lang, localService: true, name: lang, voiceURI: lang, default: false }));
  const engine = {
    speaking: false,
    pending: false,
    getVoices: () => voices,
    speak: vi.fn(),
    cancel: vi.fn(),
    resume: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal('speechSynthesis', engine);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  return engine;
}

const metta = { pali: 'mettā', pronunciation: 'MET-taa' };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('SpeakButton', () => {
  it('speaks the word in Devanagari through an Indic voice on tap', () => {
    const engine = installSpeech(['en-US', 'hi-IN']);
    render(<SpeakButton word={metta} />);
    expect(engine.speak).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('hear mettā pronounced'));
    const spoken = engine.speak.mock.calls[0]?.[0] as FakeUtterance;
    expect(spoken.text).toBe('मेत्ता');
    expect(spoken.lang).toBe('hi-IN');
  });

  it('does not cancel an idle engine, which silences the next word on iOS', () => {
    const engine = installSpeech(['hi-IN']);
    render(<SpeakButton word={metta} />);
    fireEvent.click(screen.getByLabelText('hear mettā pronounced'));
    expect(engine.cancel).not.toHaveBeenCalled();
    expect(engine.speak).toHaveBeenCalledTimes(1);
  });

  it('cuts off a word still being spoken before saying the next', () => {
    const engine = installSpeech(['hi-IN']);
    engine.speaking = true;
    render(<SpeakButton word={metta} />);
    fireEvent.click(screen.getByLabelText('hear mettā pronounced'));
    expect(engine.cancel).toHaveBeenCalledTimes(1);
  });

  it('retries by language alone when the chosen voice fails', () => {
    const engine = installSpeech(['hi-IN']);
    render(<SpeakButton word={metta} />);
    fireEvent.click(screen.getByLabelText('hear mettā pronounced'));
    const first = engine.speak.mock.calls[0]?.[0] as FakeUtterance;
    first.listeners.forEach((listener) => { listener({ error: 'interrupted' }); });
    expect(engine.speak).toHaveBeenCalledTimes(1);
    first.listeners.forEach((listener) => { listener({ error: 'synthesis-failed' }); });
    const retry = engine.speak.mock.calls[1]?.[0] as FakeUtterance;
    expect(retry.text).toBe('मेत्ता');
    expect(retry.lang).toBe('hi-IN');
    expect(retry.voice).toBeNull();
  });

  it('falls back to reading the English guide, marked approximate', () => {
    const engine = installSpeech(['en-US', 'en-IN']);
    render(<SpeakButton word={metta} />);
    expect(screen.getByText(/hear it \(approximate\)/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('hear mettā pronounced, approximately'));
    const spoken = engine.speak.mock.calls[0]?.[0] as FakeUtterance;
    expect(spoken.text).toBe('met-tah');
    expect(spoken.lang).toBe('en-IN');
  });

  it('offers the add-a-Hindi-voice tip only where asked and only when approximate', () => {
    installSpeech(['en-US']);
    const { unmount } = render(<SpeakButton word={metta} tip />);
    expect(screen.getByText(/add a Hindi voice/)).toBeTruthy();
    unmount();
    render(<SpeakButton word={metta} />);
    expect(screen.queryByText(/add a Hindi voice/)).toBeNull();
    vi.unstubAllGlobals();
    installSpeech(['hi-IN']);
    render(<SpeakButton word={metta} tip />);
    expect(screen.queryByText(/add a Hindi voice/)).toBeNull();
  });

  it('renders nothing when the device has no usable voice', () => {
    installSpeech(['fr-FR']);
    const { container } = render(<SpeakButton word={metta} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when the browser has no speech engine', () => {
    const { container } = render(<SpeakButton word={metta} />);
    expect(container.innerHTML).toBe('');
  });
});
