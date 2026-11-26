// Shorter display title: the date, Hebrew date and the Rav's name are shown elsewhere on the card.
const CUT = '\u0000';
const MONTHS_FR = 'janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre';
const MONTHS_EN = 'january|february|march|april|may|june|july|august|september|october|november|december';
const MONTHS_HE = 'tichri|tishri|tishrei|marcheshvan|hechvan|heshvan|cheshvan|kislev|tevet|teveth|chevat|shevat|adar(?:\\s+(?:i{1,2}|1|2|alef|bet|beth))?|nissan|nisan|iyar|iyyar|sivan|tamouz|tammuz|tamuz|av|eloul|elul';

const PATTERNS = [
  /(?:rav|rabbi|harav|le rav)\s+yaacov(?:\s+b\.?)?\s+harrar\.?/giu,
  new RegExp(`(?:\\b(?:du|le|from|on)\\s+)?\\d{1,2}(?:er)?\\s+(?:${MONTHS_FR})\\s+\\d{4}`, 'giu'),
  new RegExp(`(?:\\b(?:on)\\s+)?(?:${MONTHS_EN})\\s+\\d{1,2},?\\s+\\d{4}`, 'giu'),
  new RegExp(`\\d{1,2}(?:er)?\\s+(?:${MONTHS_HE})\\s+5\\d{3}`, 'giu'),
  /(?<!\d)\d{1,2}[/.]\d{1,2}[/.](?:\d{4}|\d{2})(?!\d)/gu,
  /(?<!\d)\d{2}\s\d{2}\s(?:\d{4}|\d{2})(?!\d)/gu,
];

const EDGE = /^[\s\-–—:|,·]+|[\s\-–—:|,·]+$/gu;
// What is left of "Cours du <date>" once the date is removed.
const FILLER = /^(?:cours|coursdu|cours de guemara|cours sur la paracha|conf[ée]rence)(?:\s+(?:du|de|le))?$/iu;
const DANGLING = /\s+(?:du|de|le|from|on)$/iu;

export function displayTitle(title) {
  const original = String(title ?? '').trim();
  let s = original;
  for (const p of PATTERNS) s = s.replace(p, CUT);
  const parts = s.split(/\u0000|\s{3,}|\s+[-–—|]\s+/u)
    .map((p) => p.replace(EDGE, '').replace(/\s+/g, ' ').replace(DANGLING, '').replace(EDGE, ''))
    .filter((p) => p && !FILLER.test(p));
  return parts.length ? parts.join(' · ') : original;
}
