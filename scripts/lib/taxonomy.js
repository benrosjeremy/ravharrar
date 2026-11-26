// The old ravharrar.com categories, read from its dropdown menus on 2026-11-26.
// slug: stable id used by the new site. oldSlug: path on the old Wix site.
// aliases: lowercase, accent-free spellings found in lesson titles.

/** @typedef {{slug:string, series:'parasha'|'gemara'|'chag'|'other'|'hebrew', kind:string, fr:string, he:string, oldSlug:string, aliases:string[]}} Category */

const P = (slug, fr, he, aliases = []) => ({ slug, series: 'parasha', kind: 'parasha', fr, he, oldSlug: slug, aliases });

const PARASHOT = [
  P('berechit', 'Berechit', 'בראשית', ['bereshit', 'bereshith', 'bereishit']),
  P('noah', 'Noah', 'נח', ['noach']),
  P('lekh-lekha', 'Lekh Lekha', 'לך לך', ['lech lecha', 'lekh lekha', 'lech lekha']),
  P('vayera', 'Vayera', 'וירא', ['vayeira']),
  P('haye-sarah', 'Haye Sarah', 'חיי שרה', ['chayei sarah', 'haye sarah', 'hayei sarah']),
  P('toldot', 'Toldot', 'תולדות', ['toledot']),
  P('vayetse', 'Vayetse', 'ויצא', ['vayetze', 'vayeitzei']),
  P('vayichlah', 'Vayichlah', 'וישלח', ['vayishlach', 'vayishlah']),
  P('vayechev', 'Vayechev', 'וישב', ['vayeshev', 'vayeishev']),
  P('mikets', 'Mikets', 'מקץ', ['miketz', 'mikeitz']),
  P('vayigach', 'Vayigach', 'ויגש', ['vayigash']),
  P('vayehi', 'Vayehi', 'ויחי', ['vayechi']),
  P('chemot', 'Chemot', 'שמות', ['shemot', 'shemoth']),
  P('vaera', 'Vaera', 'וארא', ["va'era", 'vaeira']),
  P('bo', 'Bo', 'בא', []),
  P('bechalah', 'Bechalah', 'בשלח', ['beshalach', 'beshalah']),
  P('yitro', 'Yitro', 'יתרו', ['jethro']),
  P('michpatim', 'Michpatim', 'משפטים', ['mishpatim']),
  P('terouma', 'Terouma', 'תרומה', ['terumah', 'trouma']),
  P('tetsave', 'Tetsave', 'תצוה', ['tetzaveh', 'tetsaveh']),
  P('ki-tissa', 'Ki Tissa', 'כי תשא', ['ki tisa', 'ki tissa']),
  P('vayakel-pekoude', 'Vayakel / Pekoude', 'ויקהל פקודי', ['vayakhel', 'vayakel', 'pekudei', 'pekoude']),
  P('vayikra', 'Vayikra', 'ויקרא', []),
  P('tsav', 'Tsav', 'צו', ['tzav']),
  P('chemini', 'Chemini', 'שמיני', ['shemini', 'shmini']),
  P('tazria-metsora', 'Tazria / Metsora', 'תזריע מצורע', ['tazria', 'metzora']),
  P('ahare-mot-kedochim', 'Ahare Mot / Kedochim', 'אחרי מות קדושים', ['acharei mot', 'ahare mot', 'kedoshim', 'kedochim']),
  P('emor', 'Emor', 'אמור', []),
  P('behar-behoukotay', 'Behar / Behoukotay', 'בהר בחוקותי', ['behar', 'bechukotai', 'behoukotay', 'bechukotay']),
  P('bamidbar', 'Bamidbar', 'במדבר', ['bemidbar']),
  P('nasso', 'Nasso', 'נשא', ['naso']),
  P('beaalotekha', 'Beaalotekha', 'בהעלותך', ['behaalotecha', "beha'alotcha", 'behaalotekha']),
  P('chelah-lekha', 'Chelah Lekha', 'שלח לך', ['shelach', 'shelach lecha', 'chelah lekha']),
  P('korah', 'Korah', 'קרח', ['korach']),
  P('houkat', 'Houkat', 'חקת', ['chukat', 'hukat']),
  P('balak', 'Balak', 'בלק', []),
  P('pinhas', 'Pinhas', 'פינחס', ['pinchas']),
  P('matot-massei', 'Matot / Massei', 'מטות מסעי', ['matot', 'masei', 'massei']),
  P('devarim', 'Devarim', 'דברים', []),
  P('vaethanane', 'Vaethanane', 'ואתחנן', ['vaetchanan', "va'etchanan", 'vaethanan']),
  P('ekev', 'Ekev', 'עקב', ['eikev']),
  P('reeh', 'Reeh', 'ראה', ["re'eh"]),
  P('choftim', 'Choftim', 'שופטים', ['shoftim']),
  P('ki-tetse', 'Ki Tetse', 'כי תצא', ['ki teitzei', 'ki tetze', 'ki tetse']),
  P('ki-tavo', 'Ki Tavo', 'כי תבוא', ['ki savo', 'ki tavo']),
  P('nitsavim-vayelekh', 'Nitsavim / Vayelekh', 'נצבים וילך', ['nitzavim', 'nitsavim', 'vayelech', 'vayelekh']),
  P('haazinou', 'Haazinou', 'האזינו', ['haazinu', "ha'azinu"]),
  { ...P('vezot-haberakha', 'Vezot Haberakha', 'וזאת הברכה', ['vezot haberacha', 'vezot habracha', 'vezot haberakha']), oldSlug: 'vezothaberakha' },
];

const G = (slug, oldSlug, fr, he, aliases) => ({ slug, series: 'gemara', kind: 'gemara', fr, he, oldSlug, aliases });

const GEMARA = [
  G('roch-hachana-gemara', 'roch-hachana-1', 'Roch Hachana', 'ראש השנה', ['rosh hashana', 'rosh hashanah', 'roch hachana']),
  G('yoma', 'yoma', 'Yoma', 'יומא', []),
  G('beitsa', 'beitsa', 'Beitsa', 'ביצה', ['beitzah', 'beitza', 'betsa']),
  G('soucca', 'guemara-soucca', 'Soucca', 'סוכה', ['sukkah', 'sukka', 'souka']),
  G('taanit', 'guemara-taanit', 'Taanit', 'תענית', ["ta'anit", 'taanis']),
  G('meguila', 'meguila', 'Meguila', 'מגילה', ['megillah', 'megila', 'meguilah']),
  G('moed-katane', 'moedkatane', 'Moed Katane', 'מועד קטן', ['moed katan', 'moed katane']),
  G('haguiga', 'haguiga', 'Haguiga', 'חגיגה', ['chagigah', 'hagiga', 'chagiga']),
  G('erouvine', 'erouvine', 'Erouvine', 'עירובין', ['eruvin', 'erouvin']),
  G('ketoubot', 'ketoubot', 'Ketoubot', 'כתובות', ['ketubot', 'kesubos', 'ketuvot']),
  G('kidouchine', 'kidouchine', 'Kidouchine', 'קידושין', ['kiddushin', 'kidushin', 'kidouchin']),
];

const C = (slug, oldSlug, fr, he, aliases) => ({ slug, series: 'chag', kind: 'chag', fr, he, oldSlug, aliases });

const CHAGIM = [
  C('roch-hachana', 'roch-hachana', 'Roch Hachana', 'ראש השנה', ['rosh hashana', 'rosh hashanah', 'roch hachana']),
  C('yom-kippour', 'yom-kippour', 'Les 10 jours de Techouva et Yom Kippour', 'עשרת ימי תשובה ויום כיפור', ['yom kippour', 'yom kippur', 'kippour', 'kippur']),
  C('souccot', 'souccot', 'Souccot', 'סוכות', ['souccot', 'sukkot', 'succot', 'soukot']),
  C('hanouka', 'hanouka', 'Hanouka', 'חנוכה', ['hanouka', 'chanukah', 'hanukkah', 'hanoucca', 'hanuka']),
  C('pourim', 'pourim', 'Pourim', 'פורים', ['pourim', 'purim']),
  C('pessah', 'pessah', 'Pessah', 'פסח', ['pessah', 'pesach', 'pessach', 'pesah']),
  C('yom-haatsmaout', 'yom-haatsmaout', 'Yom Haatsmaout', 'יום העצמאות', ['yom haatsmaout', 'yom haatzmaut']),
  C('yom-yerouchalayim', 'yom-yerouchalayim', 'Yom Yerouchalayim', 'יום ירושלים', ['yom yerouchalayim', 'yom yerushalayim']),
  C('chavouot', 'chavouot', 'Chavouot', 'שבועות', ['chavouot', 'shavuot', 'shavuos']),
  C('9-av', '9-av', '9 Av', 'תשעה באב', ['9 av', 'tisha beav', "tisha b'av", 'ticha beav']),
];

const O = (slug, fr, he, aliases = []) => ({ slug, series: 'other', kind: 'other', fr, he, oldSlug: slug, aliases });

const OTHER = [
  O('la-priere', 'La prière', 'תפילה', ['priere', 'tefila', 'tefilah']),
  O('chabbat', 'Chabbat', 'שבת', ['chabbat', 'shabbat']),
  O('halakha', 'Halakha', 'הלכה', ['halakha', 'halacha']),
  O('la-techouva', 'La Techouva', 'תשובה', ['techouva', 'teshuva', 'teshuvah']),
  O('erets-israel', 'Erets Israël', 'ארץ ישראל', ['erets israel', 'eretz israel', 'eretz yisrael']),
  O('education', 'Éducation', 'חינוך', ['education', 'hinoukh', 'chinuch']),
  O('cours-pour-les-jeunes', 'Pour les adolescents', 'לנוער', ['adolescents', 'jeunes']),
  O('gueoula', 'La délivrance finale', 'הגאולה השלמה', ['gueoula', 'geoula', 'geula', 'delivrance']),
  O('actualites', 'Actualités', 'אקטואליה', ['actualite', 'actualites']),
  O('hiloula', 'Hiloula', 'הילולות', ['hiloula', 'hilula']),
  O('libre-arbitre', 'Libre-Arbitre', 'בחירה חופשית', ['libre arbitre', 'libre-arbitre', 'free will']),
  O('likoutey-moharane', 'Likoutey Moharane', 'ליקוטי מוהר"ן', ['likoutey moharane', 'likoutey moharan', 'likutei moharan']),
  O('orot', 'Orot du Rav A. I. Hakohen Kook', 'אורות לראי"ה קוק', ['orot']),
  O('cours-pour-les-femmes', 'Cours pour les femmes', 'שיעורים לנשים', ['femmes', 'women']),
];

const H = (kind, slug, oldSlug, fr, he) => ({ slug: `he-${slug}`, series: 'hebrew', kind, fr, he, oldSlug, aliases: [] });

const HEBREW = [
  H('other', 'hiloulot', 'הילולות', 'Hiloulot (hébreu)', 'הילולות'),
  H('other', 'likoutey-moharan', 'likoutey-moharan', 'Likoutey Moharan (hébreu)', 'ליקוטי מוהר"ן'),
  H('other', 'yehoshua', 'ספר-יהושע', 'Livre de Josué (hébreu)', 'ספר יהושע'),
  H('chag', 'roch-hodesh', '4db1ce7dbdf8e', 'Roch Hodech', 'ראש חודש'),
  H('chag', 'roch-hachana', '4db1ce8dba9a9a', 'Roch Hachana', 'ראש השנה'),
  H('chag', 'yom-kippour', '9dbhn9dbhf1bv', 'Yom Kippour', 'יום כיפור'),
  H('chag', 'souccot', '9dbarw2c', 'Souccot', 'סוכות'),
  H('chag', 'hanouka', '8dbbfrx', 'Hanouka', 'חנוכה'),
  H('chag', 'pourim', '9dbimzv', 'Pourim', 'פורים'),
  H('chag', 'pessah', 'cebti', 'Pessah', 'פסח'),
  H('chag', 'chavouot', '5dbia5c6ak', 'Chavouot', 'שבועות'),
  H('chag', '9-av', '8db1aud4dbbb', '9 Av', 'תשעה באב'),
  H('chag', 'yom-hachoah', '9dbhn4dbhbc3h', 'Yom Hachoah', 'יום השואה'),
  ...[
    ['berechit', 'berechit-hebrew', 'Berechit', 'בראשית'], ['noah', 'noah-hebrew', 'Noah', 'נח'],
    ['lekh-lekha', 'lekhlekha-hebrew', 'Lekh Lekha', 'לך לך'], ['vayera', 'vayera-hebrew', 'Vayera', 'וירא'],
    ['haye-sarah', 'hayesarah-hebrew', 'Haye Sarah', 'חיי שרה'], ['toldot', 'toldot-hebrew', 'Toldot', 'תולדות'],
    ['vayetse', 'vayetse-hebrew', 'Vayetse', 'ויצא'], ['vayichlah', 'vayishlah-hebrew', 'Vayichlah', 'וישלח'],
    ['vayechev', 'vayeshev-hebrew', 'Vayechev', 'וישב'], ['mikets', 'mikets-hebrew', 'Mikets', 'מקץ'],
    ['vayigach', 'vayigash-hebrew', 'Vayigach', 'ויגש'], ['vayehi', 'vayehi-hebrew', 'Vayehi', 'ויחי'],
    ['chemot', 'chemot-hebrew', 'Chemot', 'שמות'], ['vaera', 'vaera-hebrew', 'Vaera', 'וארא'],
    ['bo', 'bo-hebrew', 'Bo', 'בא'], ['bechalah', 'beshalah-hebrew', 'Bechalah', 'בשלח'],
    ['yitro', 'yitro-hebrew', 'Yitro', 'יתרו'], ['michpatim', 'michpatim-hebrew', 'Michpatim', 'משפטים'],
    ['terouma', 'terouma-hebrew', 'Terouma', 'תרומה'], ['tetsave', 'tetsave-hebrew', 'Tetsave', 'תצוה'],
    ['ki-tissa', 'kitissa-hebrew', 'Ki Tissa', 'כי תשא'], ['vayakel-pekoude', 'vayakhelpekoude-hebrew', 'Vayakel / Pekoude', 'ויקהל פקודי'],
    ['vayikra', 'vayikra-hebrew', 'Vayikra', 'ויקרא'], ['tsav', 'tsav-hebrew', 'Tsav', 'צו'],
    ['chemini', 'shemini-hebrew', 'Chemini', 'שמיני'], ['tazria-metsora', 'tazriametsorah-hebrew', 'Tazria / Metsora', 'תזריע מצורע'],
    ['ahare-mot-kedochim', 'aharemotkedochim-hebrew', 'Ahare Mot / Kedochim', 'אחרי מות קדושים'], ['emor', 'emor-hebrew', 'Emor', 'אמור'],
    ['behar', 'behar-hebrew', 'Behar', 'בהר'], ['behoukotay', 'behukotay-hebrew', 'Behoukotay', 'בחוקותי'],
    ['bamidbar', 'bamidbar-hebrew', 'Bamidbar', 'במדבר'], ['nasso', 'nasso-hebrew', 'Nasso', 'נשא'],
    ['beaalotekha', 'beaalotekha-hebrew', 'Beaalotekha', 'בהעלותך'], ['chelah-lekha', 'chelahlekha-hebrew', 'Chelah Lekha', 'שלח לך'],
    ['korah', 'korah-hebrew', 'Korah', 'קרח'], ['houkat', 'hukat-hebrew', 'Houkat', 'חקת'],
    ['balak', 'balak-hebrew', 'Balak', 'בלק'], ['pinhas', 'pinhas-hebrew', 'Pinhas', 'פינחס'],
    ['matot-massei', 'matotmassei-hebrew', 'Matot / Massei', 'מטות מסעי'], ['devarim', 'pebide5dbdtq7c', 'Devarim', 'דברים'],
    ['vaethanane', 'pebide4dbjh6ae2d', 'Vaethanane', 'ואתחנן'], ['ekev', 'pebide5db7ap', 'Ekev', 'עקב'],
    ['reeh', 'pebide4dbi2d', 'Reeh', 'ראה'], ['choftim', 'pebide9dbgdq6a2a', 'Choftim', 'שופטים'],
    ['ki-tetse', 'pebideeebd4db7bl', 'Ki Tetse', 'כי תצא'], ['ki-tavo', 'pebideeebd4dbbm6f', 'Ki Tavo', 'כי תבוא'],
    ['nitsavim-vayelekh', '9dbh6aqfi5dbqmj4a9dbidh', 'Nitsavim / Vayelekh', 'נצבים וילך'], ['haazinou', 'pebide4dbhedp6b', 'Haazinou', 'האזינו'],
  ].map(([s, o, fr, he]) => H('parasha', `parasha-${s}`, o, fr, `פרשת ${he}`)),
];

// Add the Hebrew name of each category as an alias so Hebrew titles match too.
for (const c of [...PARASHOT, ...GEMARA, ...CHAGIM, ...OTHER]) {
  c.aliases = [...new Set([...c.aliases, c.fr.toLowerCase(), c.he])];
}

/** @type {Category[]} */
export const CATEGORIES = [...PARASHOT, ...GEMARA, ...CHAGIM, ...OTHER, ...HEBREW];

/** Last daf of each tractate taught on the site. Dafim start at 2a. */
export const DAF_COUNTS = {
  'roch-hachana-gemara': 35, yoma: 88, beitsa: 40, soucca: 56, taanit: 31,
  meguila: 32, 'moed-katane': 29, haguiga: 27, erouvine: 105, ketoubot: 112, kidouchine: 82,
};

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

/** @param {string} slug @returns {Category|undefined} */
export function categoryBySlug(slug) {
  return BY_SLUG.get(slug);
}
