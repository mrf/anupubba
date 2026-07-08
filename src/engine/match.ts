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
