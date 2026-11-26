// Accessibility statement (הצהרת נגישות), in both languages. Contact details come from config.js.
import config from '../../config.js';
import { currentLang } from '../i18n.js';
import { esc } from '../ui.js';

const UPDATED = { fr: '26 novembre 2026', he: '26 בנובמבר 2026' };

const TEXT = {
  fr: {
    title: "Déclaration d'accessibilité",
    intro: "Nous voulons que chacun, y compris les personnes en situation de handicap, puisse écouter les cours du Rav. Ce site a été adapté pour répondre à la norme israélienne 5568, fondée sur les règles internationales WCAG 2.1, niveau AA.",
    doneTitle: 'Ce qui a été fait',
    done: [
      'Navigation complète au clavier, avec un lien « Aller au contenu » et un repère visible sur l’élément actif.',
      'Structure de titres et de régions claire pour les lecteurs d’écran ; boutons et liens avec un nom explicite.',
      'Contrastes de couleurs suffisants, en mode clair comme en mode sombre.',
      'Le site s’adapte aux téléphones et au zoom du navigateur, et respecte le réglage « réduire les animations ».',
      'Lecteur vidéo en plein écran annoncé comme une fenêtre : le clavier y reste, Échap le referme.',
      'Langue et sens d’écriture (français / hébreu) déclarés sur chaque page.',
    ],
    toolTitle: "Le menu d'accessibilité",
    tool: "Le bouton en forme de personnage, en haut de chaque page, permet d’agrandir le texte, d’augmenter le contraste, de souligner les liens, de passer à une police plus lisible et d’arrêter les animations. Vos choix sont gardés sur cet appareil.",
    limitsTitle: 'Limites connues',
    limits: [
      'Les vidéos sont diffusées par YouTube : le lecteur et ses sous-titres automatiques dépendent de YouTube.',
      'Les cours n’ont pas de transcription écrite.',
    ],
    contactTitle: 'Un problème ? Contactez-nous',
    contact: "Si une partie du site vous est difficile d'accès, dites-le-nous : nous ferons de notre mieux pour la corriger rapidement.",
    name: 'Responsable accessibilité',
    email: 'E-mail',
    phone: 'Téléphone',
    fallback: 'Écrivez-nous sur la page Facebook du Rav',
    updated: 'Dernière mise à jour de cette déclaration',
  },
  he: {
    title: 'הצהרת נגישות',
    intro: 'חשוב לנו שכל אחד, כולל אנשים עם מוגבלות, יוכל ללמוד מהשיעורים של הרב. האתר הונגש בהתאם לתקן הישראלי 5568, המבוסס על הנחיות WCAG 2.1 ברמה AA.',
    doneTitle: 'מה נעשה באתר',
    done: [
      'אפשר לנווט בכל האתר במקלדת, כולל קישור „דילוג לתוכן” וסימון ברור של הרכיב שבפוקוס.',
      'מבנה כותרות ואזורים ברור לקוראי מסך; לכל כפתור וקישור יש שם מובן.',
      'ניגודיות צבעים מספקת, במצב בהיר ובמצב כהה.',
      'האתר מתאים את עצמו לטלפונים ולהגדלה בדפדפן, ומכבד את ההגדרה „הפחתת תנועה”.',
      'נגן הווידאו במסך מלא מוגדר כחלון: המקלדת נשארת בתוכו, ו-Esc סוגר אותו.',
      'שפת העמוד וכיוון הכתיבה (עברית / צרפתית) מוגדרים בכל עמוד.',
    ],
    toolTitle: 'תפריט הנגישות',
    tool: 'הכפתור עם סמל הדמות, בראש כל עמוד, מאפשר להגדיל טקסט, להגביר ניגודיות, להדגיש קישורים, לעבור לגופן קריא ולעצור אנימציות. הבחירות נשמרות במכשיר שלכם.',
    limitsTitle: 'מגבלות ידועות',
    limits: [
      'הסרטונים מוגשים דרך יוטיוב: הנגן והכתוביות האוטומטיות תלויים ביוטיוב.',
      'לשיעורים אין תמלול כתוב.',
    ],
    contactTitle: 'נתקלתם בבעיה? פנו אלינו',
    contact: 'אם חלק מהאתר לא נגיש עבורכם, ספרו לנו ונעשה כמיטב יכולתנו לתקן במהירות.',
    name: 'רכז/ת נגישות',
    email: 'דוא״ל',
    phone: 'טלפון',
    fallback: 'כתבו לנו בעמוד הפייסבוק של הרב',
    updated: 'עדכון אחרון של ההצהרה',
  },
};

export function renderAccessibility(root) {
  const lang = currentLang() === 'he' ? 'he' : 'fr';
  const x = TEXT[lang];
  const c = config.accessibilityContact ?? {};
  const lines = [
    c.name && `<li>${esc(x.name)}: ${esc(c.name)}</li>`,
    c.email && `<li>${esc(x.email)}: <a href="mailto:${esc(c.email)}" dir="ltr">${esc(c.email)}</a></li>`,
    c.phone && `<li>${esc(x.phone)}: <a href="tel:${esc(c.phone.replace(/[^\d+]/g, ''))}" dir="ltr">${esc(c.phone)}</a></li>`,
  ].filter(Boolean);
  if (!c.email && !c.phone) lines.push(`<li><a href="${esc(config.facebookUrl)}" target="_blank" rel="noopener">${esc(x.fallback)}</a></li>`);
  const list = (items) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

  root.innerHTML = `<article class="view wrap statement" aria-labelledby="statement-title">
    <h1 id="statement-title">${esc(x.title)}</h1>
    <p>${esc(x.intro)}</p>
    <h2>${esc(x.doneTitle)}</h2>${list(x.done)}
    <h2>${esc(x.toolTitle)}</h2><p>${esc(x.tool)}</p>
    <h2>${esc(x.limitsTitle)}</h2>${list(x.limits)}
    <h2>${esc(x.contactTitle)}</h2><p>${esc(x.contact)}</p><ul>${lines.join('')}</ul>
    <p class="muted">${esc(x.updated)}: ${esc(UPDATED[lang])}</p>
  </article>`;
}
