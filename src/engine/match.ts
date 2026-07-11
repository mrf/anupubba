/**
 * ASCII-forgiving matching for the recall stage (§3.2): typing "sankhara"
 * counts for "saṅkhāra". Correct diacritics are always shown afterwards.
 */
export function foldPali(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function matchesPali(input: string, target: string): boolean {
  const folded = foldPali(input);
  return folded.length > 0 && folded === foldPali(target);
}

/**
 * The forgiving fold: on top of foldPali, erase exactly the distinctions a
 * listener can't spell from sound alone — the sound classes Lesson 0 teaches.
 * Vowel identity stays load-bearing so sati ≠ sata and pīti ≠ sukha; a
 * catalog test asserts no two shipped words collide under this fold.
 */
export function foldPaliLoose(input: string): string {
  return (
    foldPali(input)
      // ñ heard as "n-y" (paññā is taught as PUN-yaa)
      .replace(/ny/g, 'n')
      // aspiration dropped: kh gh ch jh th dh ph bh → bare stop
      .replace(/([kgcjtdpb])h/g, '$1')
      // doubling dropped (mettā → meta) — also folds velthuis "aa" to "a"
      .replace(/(.)\1+/g, '$1')
      // nasal place before a consonant: saṃsāra heard as "sansara"
      .replace(/m(?=[^aeiou])/g, 'n')
  );
}

export function matchesPaliLoosely(input: string, target: string): boolean {
  const folded = foldPaliLoose(input);
  return folded.length > 0 && folded === foldPaliLoose(target);
}
