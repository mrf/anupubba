/**
 * Sanskrit equivalents of the shipped Pali terms, keyed by word id, plus the
 * romanisations practitioners actually type (smriti, pragya, shraddha…).
 *
 * The recall drill accepts any of these as a correct answer (§3.2). Each
 * spelling goes through the same folds as the Pali form, so the IAST entry
 * already covers its plain-ASCII strip (smṛti → smrti) and the sound-
 * forgiving variants; list a romanisation explicitly only when it changes
 * letters the fold can't recover (ṛ → ri, ś/ṣ → sh, jñ → gy, ā → aa is free).
 *
 * Words whose Sanskrit is spelt identically to the Pali (karuṇā, muditā,
 * samādhi, sukha…) have no entry. A catalog test guards that no alias
 * collides with another word under the loose fold, and buildCatalog rejects
 * any key that no longer names a shipped word.
 */
export const SANSKRIT_ALIASES: Readonly<Record<string, readonly string[]>> = {
  // three refuges
  dhamma: ['dharma'],
  sangha: ['saṃgha', 'samgha'],
  // three marks
  anicca: ['anitya'],
  dukkha: ['duḥkha', 'duhkha'],
  anatta: ['anātman', 'anatman', 'anātma', 'anatma'],
  // dāna–sīla–bhāvanā
  sila: ['śīla', 'shila', 'sheela'],
  // four noble truths
  tanha: ['tṛṣṇā', 'trsna', 'trishna', 'trshna'],
  magga: ['mārga', 'marga'],
  nibbana: ['nirvāṇa', 'nirvana'],
  // five khandhas
  sanna: ['saṃjñā', 'samjna', 'sanjna', 'samjnya', 'sangya'],
  sankhara: ['saṃskāra', 'samskara', 'sanskara', 'sanskar'],
  vinnana: ['vijñāna', 'vijnana', 'vijnyana', 'vigyana', 'vigyan'],
  // foundations of practice
  sati: ['smṛti', 'smrti', 'smriti', 'smruti'],
  sampajanna: ['samprajanya', 'samprajnya'],
  samatha: ['śamatha', 'shamatha'],
  vipassana: ['vipaśyanā', 'vipashyana', 'vipasyana'],
  panna: ['prajñā', 'prajna', 'prajnya', 'pragya', 'pradnya'],
  // jhāna factors
  vitakka: ['vitarka'],
  piti: ['prīti', 'priti', 'preeti'],
  ekaggata: ['ekāgratā', 'ekagrata'],
  // five hindrances
  byapada: ['vyāpāda', 'vyapada'],
  thinamiddha: ['styānamiddha', 'styanamiddha'],
  uddhaccakukkucca: ['auddhatyakaukṛtya', 'auddhatyakaukrtya', 'auddhatyakaukritya'],
  vicikiccha: ['vicikitsā', 'vicikitsa'],
  // bojjhaṅgas
  dhammavicaya: ['dharmavicaya'],
  viriya: ['vīrya', 'virya', 'veerya'],
  passaddhi: ['praśrabdhi', 'prashrabdhi', 'prasrabdhi'],
  upekkha: ['upekṣā', 'upeksha', 'upeksa'],
  // brahmavihāras
  metta: ['maitrī', 'maitri', 'maitree'],
  // paṭicca-samuppāda
  avijja: ['avidyā', 'avidya'],
  phassa: ['sparśa', 'sparsha', 'sparsa'],
};
