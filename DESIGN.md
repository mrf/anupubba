# Anupubba — Design Document

**Name:** *Anupubba* — *anu-* (following after) + *pubba* (what came before): gradual, step-by-step, in due order. References **anupubbasikkhā** (the gradual training, the spine of the onboarding design), **anupubbakathā** (the Buddha's graduated talk — his own curriculum sequencing), and the ocean-shelf simile (Ud 5.5). The name also describes the mechanic honestly: spaced repetition is anupubba — each rep following what came before.
**Status:** Draft v1 — design phase, pre-prototype
**Author:** Mark (with Claude)
**Date:** July 2026

---

## 1. Purpose & Vision

A gamified Pali vocabulary app for dharma practitioners — people who listen to talks, read suttas, and keep bumping into terms like *saṅkhāra* and *pīti* without ever pinning them down. The goal is **receptive precision**: recognizing and correctly discriminating Pali terms as they appear in dharma talks, suttas, and chants. Not composing Pali sentences.

The app converts *passive familiarity* (words heard hundreds of times in lectures) into *precise understanding*, so the user can go deeper into the teachings themselves.

Offered freely as **dāna**, in the same spirit as the equanimity tracker: no server, no analytics, no account, no monetization.

### Non-goals

- Pali grammar, declensions, or sentence production
- Reading unglossed canonical texts (a later possibility, not v1)
- Competing with Anki for power users — this is a guided, curated experience

---

## 2. Ethical Design Principles

Duolingo's engagement engine is engineered *taṇhā*: loss-aversion streaks, leagues that feed *māna* (comparison/conceit), notification-driven craving loops. A dharma app built on those mechanics would contradict its own content.

The north star is **appamāda** — heedfulness, diligence — supported without manufacturing compulsion. The Buddha's pedagogy metaphor is the ocean's gradual shelf (Ud 5.5): no sudden drop-offs, no punishment cliffs.

| Conventional mechanic | This app instead |
|---|---|
| Breakable streak + streak-freeze economy | **Lifetime cultivation count** that never resets; lapses are just returning to the breath |
| Leaderboards / leagues | None. No social comparison anywhere. |
| Hearts, timers, gems | None. No scarcity, no urgency, no economy. |
| Fail-state grading ("Wrong!") | Non-aversive grading language: **not yet / familiar / clear** |
| Infinite-scroll sessions | **Bounded sessions** — the app itself says "enough for today" (right effort as an anti-binge mechanic) |
| Dopamine reward screens | Post-session **sutta recommendation** — the app points beyond itself |
| Progress bars & XP | A **bodhi tree / lotus** that unfolds as clusters mature (*bhāvanā* literally means cultivation) |

---

## 3. Core Mechanics

### 3.1 SRS engine (the substrate)

- **FSRS** scheduling via `ts-fsrs`, state persisted in IndexedDB.
- Every other mechanic is a *presentation mode* on top of the same scheduler — one engine, many faces.

### 3.2 Mastery ladder (per word)

Each word climbs four stages:

1. **Recognition** — pick the gloss from options
2. **Recall** — produce the word (ASCII-forgiving input; correct diacritics always shown after)
3. **Discrimination** — confusable drills (see 3.3)
4. **Comprehension** — appears un-hinted in talk mode (see 3.4)

### 3.3 Confusables engine (core loop #1)

The real gap for a talk-listener isn't *dukkha* — it's the adjacent pairs:

- *pīti* vs. *sukha*
- *saññā* vs. *viññāṇa*
- *samatha* vs. *samādhi*
- *karuṇā* vs. *muditā*
- *sati* vs. *sampajañña*

**The distractor dial:** distractor difficulty scales with word maturity. New words get semantically *distant* distractors (*mettā* vs. *dukkha* vs. *saṅgha*); mature words get their true confusables. Confusables mode is not gated content — it's what recognition drills *become*. Confusable sets are authored explicitly in the deck data (see §6).

### 3.4 Talk mode (core loop #2)

Short paragraphs written the way teachers actually speak — "when *taṇhā* arises, *sati* simply notices" — with each Pali term tappable for its gloss. This is the actual skill being trained: following a dharma talk without losing the thread.

- Paragraphs are generated per cluster and constrained to the user's known + in-progress vocabulary.
- Talk mode is the **graduation experience** of every cluster.
- Tapping a term for its gloss quietly logs a "not yet" for that word's SRS state; reading through cleanly logs comprehension reps.

### 3.5 Root unlocks (meta-layer)

Mastering a word reveals its **etymology card**: *sati* ← *smṛti* (memory); *dukkha* = *du* + *kha* (the bad axle-hole); *samādhi* = *saṃ* + *ā* + *dhā* (placing together). Roots accumulate into a web: once the user owns *sam-* and *paññā*, *sampajañña* decomposes for free. Vocabulary as a graph, not a list.

---

## 4. Beginner Experience — Anupubbasikkhā (the gradual training)

Not a separate mode — the same machinery with the dials turned down.

### 4.1 Lesson 0: the sounds

Pali is phonetically regular, so a ~5-minute diacritics primer pays off across the entire app:

- Long vowels (ā, ī, ū), *c* as "ch", *ṃ* nasalization, retroflex *ṭ/ḍ/ṇ*, aspirates
- Micro-drills: "tap the long syllable in *samādhi*"
- This primer *justifies* later diacritic-discrimination exercises (*sīla* vs. *sila*) — the app taught it before testing it

### 4.2 Familiarity sort (the front door)

Users arrive with passive exposure, not zero. Show ~20 high-frequency terms; the user taps **know it / heard it / new to me**. Two minutes, seeds the entire SRS state, replaces the placement test. Respects prior contact with the teachings.

### 4.3 Cluster micro-lessons

Each lesson is **one teaching, 3–5 words**: the three refuges; the three marks; *dāna–sīla–bhāvanā*. New words always get an **introduction card first** — word, pronunciation, gloss, one canonical line — then immediate easy reps. No fail-to-learn.

### 4.4 Talk-mode lite from day one

Lesson 1 ends with a two-sentence glossed paragraph using *only* the words just learned. The "I can already follow this" moment, delivered honestly — it's real dharma language.

---

## 5. Session Design — "Session as a Sit"

- **Bell to open, bell to close.** The session is a container, like a sit.
- **Bounded length** (default ~5–10 min; user-configurable). The app ends the session — the user doesn't have to exercise willpower against it.
- **Closing screen:** cultivation count, cluster growth (tree/lotus animation), and **one sutta recommendation** connected to what was just studied — "You worked with the brahmavihāras today; here's the Mettā Sutta, 5 minutes." Reading is the treat. The finger points at the moon.
- No push notifications in v1. If ever added: opt-in, gentle, and framed as invitation, never loss-threat.

---

## 6. Content Architecture

### 6.1 Deck structure

Content ships as static **JSON decks organized by teaching cluster**:

- Tier 1 (high-frequency talk vocabulary — empirically derived, see 6.3)
- Three refuges · Three marks · *dāna–sīla–bhāvanā*
- Four Noble Truths & Eightfold Path terms
- Five khandhas · Five hindrances · Seven bojjhaṅgas
- Brahmavihāras · Eight worldly winds (*aṭṭha lokadhammā* — cross-links to the equanimity app)
- Paṭicca-samuppāda (12 links)
- **Advanced tier:** the 52 cetasikas (Abhidhamma)

### 6.2 Card schema (sketch)

```json
{
  "id": "sati",
  "pali": "sati",
  "gloss": "mindfulness; present-moment awareness",
  "literal": "memory, remembering",
  "etymology": { "root": "smṛti (Skt.)", "note": "remembering to be present" },
  "cluster": "eightfold-path",
  "confusables": ["sampajañña", "sammā-sati"],
  "canonical_line": {
    "pali": "sati ca kho ahaṃ, bhikkhave, sabbatthikaṃ vadāmi",
    "ref": "sn46.53:12.1"
  },
  "sources": [
    { "type": "sutta", "ref": "sn46.53:12.1", "url": "https://suttacentral.net/sn46.53" },
    { "type": "dictionary", "ref": "dpd:sati", "url": "https://dpdict.net/?q=sati" }
  ],
  "pronunciation": "SUH-ti"
}
```

SuttaCentral segment IDs (e.g., `sn56.11:5.2`) are stable and machine-readable — store references as IDs, generate links. The deck format doubles as a **citation graph** that could be visualized later.

### 6.3 Empirical frequency corpus

Derive Tier 1 deck order from actual dharma talk transcripts (Audio Dharma publishes them):

1. Scrape/collect transcripts
2. Extract Pali term frequency (diacritic-normalized matching against a term lexicon)
3. Rank → Tier 1 is literally the words teachers say most

No guessing at curriculum. This is a self-contained engineering side quest and a good first Claude Code task.

---

## 7. Citations — Ehipassiko

"Come and see for yourself" — clickable sources are that invitation encoded in the UI (Kālāma Sutta spirit). Every claim is verifiable.

- **Canonical anchors:** SuttaCentral segment-level URLs; Bodhi/Sujato translations available side-by-side on target pages
- **Dictionary:** Digital Pali Dictionary (dpdict.net, open source) primary; PTS dictionary as scholarly backup
- **Learning-science claims cited too:** if the app says "we space reviews because forgetting curves," link the FSRS paper and testing-effect research. No faith required in the mechanics either.

---

## 8. Technical Architecture

Same shape as the equanimity tracker:

- **Static PWA on GitHub Pages** — no server, no accounts, no analytics
- **Preact or Svelte** (decide at prototype time; either fits)
- **IndexedDB** for SRS state, settings, cultivation count
- **`ts-fsrs`** for scheduling
- **Offline-first** service worker; decks bundled as static JSON
- **Audio:** deferred. Pali is phonetically regular, so text pronunciation guides suffice for v1; recorded audio (or curated links to chanting recordings) is a v2 candidate
- Export/import of local state as JSON (data belongs to the user)

---

## 9. Roadmap

**Phase 0 — Corpus & decks**
Transcript frequency analysis · author Tier 1 + 2–3 cluster decks with confusable sets and sources · finalize card schema

**Phase 1 — Core loop prototype**
FSRS integration · recognition/recall drills with distractor dial · familiarity sort · Lesson 0 · session container (bells, bound, closing screen)

**Phase 2 — The two cores**
Confusables mode (mature-word drills) · talk mode with tappable glosses · sutta recommendations on close

**Phase 3 — Depth**
Root/etymology unlock layer · bodhi tree/lotus progress visualization · remaining clusters · cetasikas tier

**Phase 4 — Polish & dāna release**
PWA install flow · export/import · citation graph view (stretch) · publish

---

## 10. Open Questions

- Talk-mode paragraphs: hand-authored per cluster (quality, effort) vs. LLM-generated then human-reviewed (scale)?
- How the eight-worldly-winds cluster cross-links with the equanimity app — deep link? shared visual language?
- Diacritic input on mobile for recall stage: ASCII-forgiving matching is settled, but should there be an optional diacritic keyboard row as a teaching tool?
- Pronunciation audio sourcing for v2 (self-recorded vs. linking existing chanting resources).
