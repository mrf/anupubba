import { fireEvent, render, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { App } from './app.tsx';
import { catalog } from './data/catalog.ts';
import { shortGloss } from './ui/drills.tsx';

/** The recognition drill prompts with the pali; answer with its own gloss. */
function answerRecognition(container: Element) {
  const prompt = container.querySelector('.pali-big')?.textContent;
  const word = [...catalog.words.values()].find((w) => w.pali === prompt);
  if (word === undefined) throw new Error(`no word for prompt "${prompt ?? ''}"`);
  fireEvent.click(screen.getByText(shortGloss(word)));
}

describe('App', () => {
  it('walks a fresh user from familiarity sort into the sounds primer', async () => {
    render(<App />);

    // The familiarity sort is the front door (§4.2).
    await screen.findByText('heard it');
    expect(screen.getByText('know it')).toBeTruthy();

    // Answer all ~20 terms.
    let remaining = catalog.familiarity.length;
    while (remaining > 0) {
      const newToMe = await screen.findByText('new to me');
      fireEvent.click(newToMe);
      remaining -= 1;
    }

    // Landing in Lesson 0, the sounds (§4.1).
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'the sounds' })).toBeTruthy();
    });

    // Skipping the primer lands home, with the session invitation.
    fireEvent.click(screen.getByText(/skip for now/i));
    await screen.findByText(/begin a session/i);
    expect(screen.getByText(/lifetime/i)).toBeTruthy();
  });

  it('runs a first session end to end: intros, drills, talk, closing', async () => {
    const { container } = render(<App />);

    // This test file shares one IndexedDB with the previous test, which
    // finished onboarding — so a fresh mount lands home.
    fireEvent.click(await screen.findByText(/begin a session/i));

    // First session: three refuges, intro then drill each, then the talk.
    for (let i = 0; i < 3; i++) {
      await screen.findByText('continue'); // intro card
      fireEvent.click(screen.getByText('continue'));
      await waitFor(() => {
        expect(container.querySelectorAll('.options .option').length).toBe(4);
      });
      answerRecognition(container);
      fireEvent.click(await screen.findByText('continue'));
    }

    // Talk-lite graduation (§4.4): tap one term, then finish.
    await screen.findByText('finished reading');
    fireEvent.click(screen.getByText('saṅgha'));
    expect(await screen.findByText(/community of practitioners/)).toBeTruthy();
    fireEvent.click(screen.getByText('finished reading'));

    // Closing screen (§5): bounded end, growth, one sutta recommendation.
    await screen.findByText('enough for today');
    expect(screen.getByText('Saraṇagamana — Going for Refuge')).toBeTruthy();
    expect(screen.getByText(/this sit/)).toBeTruthy();

    fireEvent.click(screen.getByText('close'));
    await screen.findByText(/begin a session/i);
  });
});
