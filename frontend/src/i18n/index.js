import { createI18n } from 'vue-i18n';
import tr from './tr.js';
import en from './en.js';

// Default to Turkish; remember the user's choice across sessions.
const saved = localStorage.getItem('locale');
const locale = saved === 'en' || saved === 'tr' ? saved : 'tr';

const i18n = createI18n({
  legacy: false,
  locale,
  fallbackLocale: 'en',
  messages: { tr, en },
});

export function setLocale(next) {
  i18n.global.locale.value = next;
  localStorage.setItem('locale', next);
  document.documentElement.setAttribute('lang', next);
}

document.documentElement.setAttribute('lang', locale);

export default i18n;
