import { vi } from 'vitest';

export class FakeUtterance {
  voice: SpeechSynthesisVoice | null = null;
  lang = '';
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

/** Stub the Web Speech API with voices in the given languages. */
export function installSpeech(langs: readonly string[], options: { events?: boolean } = {}) {
  const voices = langs.map((lang) => ({ lang, localService: true, name: lang, voiceURI: lang, default: false }));
  const engine: Record<string, unknown> & {
    getVoices: () => typeof voices;
    speak: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    resume: ReturnType<typeof vi.fn>;
    speaking: boolean;
    pending: boolean;
    paused: boolean;
    onvoiceschanged: (() => void) | null;
  } = {
    getVoices: () => voices,
    speak: vi.fn(),
    cancel: vi.fn(),
    resume: vi.fn(),
    speaking: false,
    pending: false,
    paused: false,
    onvoiceschanged: null,
  };
  if (options.events !== false) {
    engine['addEventListener'] = vi.fn();
    engine['removeEventListener'] = vi.fn();
  }
  vi.stubGlobal('speechSynthesis', engine);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  return engine;
}

/** The text of every utterance handed to the engine, in order. */
export function spokenTexts(engine: { speak: ReturnType<typeof vi.fn> }): string[] {
  return engine.speak.mock.calls.map((call) => (call[0] as FakeUtterance).text);
}
