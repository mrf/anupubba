# Anupubba

Gamified Pali vocabulary for dharma practitioners — *anu-* (following after) + *pubba* (what came before): gradual, step-by-step, in due order.

For people who listen to talks, read suttas, and keep bumping into *saṅkhāra* and *pīti* without ever pinning them down. The goal is **receptive precision**: recognizing and discriminating Pali terms as they appear in talks, suttas, and chants — not composing Pali. Offered freely as dāna: no server, no analytics, no account.

See [DESIGN.md](DESIGN.md) for the full design, including the ethical-design principles (no streaks, no leaderboards, no urgency — a lifetime cultivation count that only grows, bounded "session as a sit" containers, and a closing sutta recommendation that points beyond the app).

## Stack

Static PWA: Preact + Vite + TypeScript (strict family, warnings are errors), [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs) scheduling, IndexedDB via `idb`, offline-first service worker via `vite-plugin-pwa`. Same shape as the [eight-winds](../worldly-winds) equanimity tracker.

```bash
npm install
npm run dev      # local dev server
npm run verify   # lint + tests + production build
npm run icons    # regenerate public/ icon set (no image deps)
```

## What's built (Phase 0–2 core)

- **Eight cluster decks, 34 words** (`src/data/decks/`): refuges, three marks, dāna–sīla–bhāvanā, four noble truths, brahmavihāras, khandhas, foundations of practice, jhāna factors — each word with gloss, literal meaning, etymology, authored confusables, SuttaCentral + Digital Pali Dictionary sources, and (where well-attested) a canonical line. A runtime validator fails the build on any dangling reference.
- **FSRS engine** with non-aversive grading (*not yet / familiar / clear*), a four-stage mastery ladder (recognition → recall → discrimination → comprehension), and the **distractor dial** — new words get distant distractors, mature words face their true confusables (*pīti* finally meets *sukha*).
- **Familiarity sort** onboarding (know it / heard it / new to me) seeding SRS state via backdated reviews; **Lesson 0** diacritics primer with tap-the-long-syllable micro-drills.
- **Session as a sit**: synthesized bell to open and close, bounded reviews-first plans, intro-card-before-drill, and **talk mode** paragraphs with tappable glosses as each cluster's graduation.
- **Closing screen**: lifetime cultivation count, per-deck growth (seed/sprout/bud/bloom), one sutta recommendation.
- **Export/import** of all local state as JSON — the data belongs to the user.

## Deferred (per DESIGN.md roadmap)

- Empirical Tier-1 frequency corpus from talk transcripts (§6.3) — deck order is hand-curated until then
- Root/etymology unlock web, bodhi-tree visualization, cetasikas tier (Phase 3)
- Citation-graph view, pronunciation audio (v2)
