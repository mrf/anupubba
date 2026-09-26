/**
 * The 52 cetasikas (mental factors) of the Abhidhammattha Saṅgaha, as the
 * standard chart groups them: 7 universals, 6 occasionals, 14 unwholesome,
 * 25 beautiful. This is the source of truth the coverage test checks the
 * shipped decks against; every entry must resolve to a catalog word.
 *
 * Twelve of the 52 were already taught by earlier decks (phassa, vedanā,
 * saññā, ekaggatā, vitakka, vicāra, pīti, viriya, vicikicchā, sati, karuṇā,
 * muditā). Word ids are global, so those stay where they are and the
 * cetasika deck for their group names them in its talk paragraph instead.
 */

export type CetasikaGroup = 'universal' | 'occasional' | 'unwholesome' | 'beautiful';

export interface CetasikaGroupInfo {
  id: CetasikaGroup;
  name: string;
  paliName: string;
  count: number;
  /** Decks whose `id` carries this group; a group may span several decks. */
  deckIds: readonly string[];
}

export interface Cetasika {
  wordId: string;
  pali: string;
  group: CetasikaGroup;
  /** The finer label the chart prints under the group heading. */
  subgroup: string;
}

export const CETASIKA_GROUPS: readonly CetasikaGroupInfo[] = [
  {
    id: 'universal',
    name: 'Universal mental factors',
    paliName: 'sabbacittasādhāraṇa',
    count: 7,
    deckIds: ['cetasikas-universals'],
  },
  {
    id: 'occasional',
    name: 'Occasional mental factors',
    paliName: 'pakiṇṇaka',
    count: 6,
    deckIds: ['cetasikas-occasionals'],
  },
  {
    id: 'unwholesome',
    name: 'Unwholesome mental factors',
    paliName: 'akusala',
    count: 14,
    deckIds: ['cetasikas-unwholesome'],
  },
  {
    id: 'beautiful',
    name: 'Beautiful mental factors',
    paliName: 'sobhana',
    count: 25,
    deckIds: [
      'cetasikas-beautiful-common',
      'cetasikas-six-pairs',
      'cetasikas-beautiful-special',
    ],
  },
];

function c(wordId: string, pali: string, group: CetasikaGroup, subgroup: string): Cetasika {
  return { wordId, pali, group, subgroup };
}

export const CETASIKAS: readonly Cetasika[] = [
  // 7 universals — present in every citta
  c('phassa', 'phassa', 'universal', 'sabbacittasādhāraṇa'),
  c('vedana', 'vedanā', 'universal', 'sabbacittasādhāraṇa'),
  c('sanna', 'saññā', 'universal', 'sabbacittasādhāraṇa'),
  c('cetana', 'cetanā', 'universal', 'sabbacittasādhāraṇa'),
  c('ekaggata', 'ekaggatā', 'universal', 'sabbacittasādhāraṇa'),
  c('jivitindriya', 'jīvitindriya', 'universal', 'sabbacittasādhāraṇa'),
  c('manasikara', 'manasikāra', 'universal', 'sabbacittasādhāraṇa'),

  // 6 occasionals — present in some cittas
  c('vitakka', 'vitakka', 'occasional', 'pakiṇṇaka'),
  c('vicara', 'vicāra', 'occasional', 'pakiṇṇaka'),
  c('adhimokkha', 'adhimokkha', 'occasional', 'pakiṇṇaka'),
  c('viriya', 'viriya', 'occasional', 'pakiṇṇaka'),
  c('piti', 'pīti', 'occasional', 'pakiṇṇaka'),
  c('chanda', 'chanda', 'occasional', 'pakiṇṇaka'),

  // 14 unwholesome
  c('moha', 'moha', 'unwholesome', 'akusalasādhāraṇa'),
  c('ahirika', 'ahirika', 'unwholesome', 'akusalasādhāraṇa'),
  c('anottappa', 'anottappa', 'unwholesome', 'akusalasādhāraṇa'),
  c('uddhacca', 'uddhacca', 'unwholesome', 'akusalasādhāraṇa'),
  c('lobha', 'lobha', 'unwholesome', 'lobha-group'),
  c('ditthi', 'diṭṭhi', 'unwholesome', 'lobha-group'),
  c('mana', 'māna', 'unwholesome', 'lobha-group'),
  c('dosa', 'dosa', 'unwholesome', 'dosa-group'),
  c('issa', 'issā', 'unwholesome', 'dosa-group'),
  c('macchariya', 'macchariya', 'unwholesome', 'dosa-group'),
  c('kukkucca', 'kukkucca', 'unwholesome', 'dosa-group'),
  c('thina', 'thīna', 'unwholesome', 'thīna-middha'),
  c('middha', 'middha', 'unwholesome', 'thīna-middha'),
  c('vicikiccha', 'vicikicchā', 'unwholesome', 'vicikicchā'),

  // 25 beautiful — 19 common to all beautiful cittas
  c('saddha', 'saddhā', 'beautiful', 'sobhanasādhāraṇa'),
  c('sati', 'sati', 'beautiful', 'sobhanasādhāraṇa'),
  c('hiri', 'hiri', 'beautiful', 'sobhanasādhāraṇa'),
  c('ottappa', 'ottappa', 'beautiful', 'sobhanasādhāraṇa'),
  c('alobha', 'alobha', 'beautiful', 'sobhanasādhāraṇa'),
  c('adosa', 'adosa', 'beautiful', 'sobhanasādhāraṇa'),
  c('tatramajjhattata', 'tatramajjhattatā', 'beautiful', 'sobhanasādhāraṇa'),
  c('kayapassaddhi', 'kāyapassaddhi', 'beautiful', 'sobhanasādhāraṇa'),
  c('cittapassaddhi', 'cittapassaddhi', 'beautiful', 'sobhanasādhāraṇa'),
  c('kayalahuta', 'kāyalahutā', 'beautiful', 'sobhanasādhāraṇa'),
  c('cittalahuta', 'cittalahutā', 'beautiful', 'sobhanasādhāraṇa'),
  c('kayamuduta', 'kāyamudutā', 'beautiful', 'sobhanasādhāraṇa'),
  c('cittamuduta', 'cittamudutā', 'beautiful', 'sobhanasādhāraṇa'),
  c('kayakammannata', 'kāyakammaññatā', 'beautiful', 'sobhanasādhāraṇa'),
  c('cittakammannata', 'cittakammaññatā', 'beautiful', 'sobhanasādhāraṇa'),
  c('kayapagunnata', 'kāyapāguññatā', 'beautiful', 'sobhanasādhāraṇa'),
  c('cittapagunnata', 'cittapāguññatā', 'beautiful', 'sobhanasādhāraṇa'),
  c('kayujukata', 'kāyujukatā', 'beautiful', 'sobhanasādhāraṇa'),
  c('cittujukata', 'cittujukatā', 'beautiful', 'sobhanasādhāraṇa'),
  // 3 abstinences
  c('sammavaca', 'sammāvācā', 'beautiful', 'virati'),
  c('sammakammanta', 'sammākammanta', 'beautiful', 'virati'),
  c('sammaajiva', 'sammā-ājīva', 'beautiful', 'virati'),
  // 2 illimitables
  c('karuna', 'karuṇā', 'beautiful', 'appamaññā'),
  c('mudita', 'muditā', 'beautiful', 'appamaññā'),
  // 1 faculty of wisdom
  c('pannindriya', 'paññindriya', 'beautiful', 'paññindriya'),
];
