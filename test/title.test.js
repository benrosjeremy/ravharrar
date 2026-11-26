import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayTitle } from '../js/title.js';

test('drops the dates and the Rav name already shown elsewhere on the card', () => {
  assert.equal(displayTitle('Guemara Kidouchine 58a   Chemita, terouma   19 novembre 2026   9 Kislev 5787   Rav Yaacov B  Harrar'), 'Guemara Kidouchine 58a · Chemita, terouma');
  assert.equal(displayTitle('Gemara Kiddushin 58a: Forbidden Money - November 18, 2026 - 8 Kislev 5787 - Rav Yaacov B. Harrar'), 'Gemara Kiddushin 58a: Forbidden Money');
  assert.equal(displayTitle("Le prix de l'amour-Cours sur la paracha Vayetse du 26 novembre 2025-6 Kislev 5786-Rav Yaacov Harrar"), "Le prix de l'amour-Cours sur la paracha Vayetse");
  assert.equal(displayTitle('L’âme d’Israël influence les sphères - 27/11/25 - Rav Yaacov Harrar'), 'L’âme d’Israël influence les sphères');
});

test('drops filler left behind once the date is gone', () => {
  assert.equal(displayTitle('Une stabilité financière - Cours du 12 décembre 2024 - Rav Yaacov Harrar'), 'Une stabilité financière');
  assert.equal(displayTitle('Une lumière pour autrui - Coursdu 2 décembre 2024 - 1er Kislev 5785'), 'Une lumière pour autrui');
  assert.equal(displayTitle('Avoir de la gratitude envers Hachem et ainsi redonner - 04 12 24'), 'Avoir de la gratitude envers Hachem et ainsi redonner');
  assert.equal(displayTitle('Moed Katane 12b - Cours de Guemara du 3 mars 2024'), 'Moed Katane 12b');
});

test('leaves a title without dates alone, and never returns empty', () => {
  assert.equal(displayTitle('La force de l\'amour qui brise les pierres'), 'La force de l\'amour qui brise les pierres');
  assert.equal(displayTitle('Le Beth HaMikdach dans la vie de l\'homme   פרשת ויצא'), 'Le Beth HaMikdach dans la vie de l\'homme · פרשת ויצא');
  assert.equal(displayTitle('Rav Yaacov B. Harrar'), 'Rav Yaacov B. Harrar');
});
